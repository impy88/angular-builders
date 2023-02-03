import { default as ora } from 'ora';

import { promises as fs } from 'fs';
import * as path from 'path';
import { WRITE_BUNDLES_TRANSFORM_TOKEN } from 'ng-packagr/lib/ng-package/entry-point/write-bundles.di';
import { writeBundlesTransform } from 'ng-packagr/lib/ng-package/entry-point/write-bundles.transform';
import { Transform, transformFromPromise } from 'ng-packagr/lib/graph/transform';
import { EntryPointNode, isEntryPoint, isEntryPointInProgress } from 'ng-packagr/lib/ng-package/nodes';
import * as log from 'ng-packagr/lib/utils/log';

import { pipe } from 'rxjs';

import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';
import autoEntry from 'rollup-plugin-auto-entry';

import { NgPackagrBuilderOptions } from './schema';

const EMPTY = '';
const overlayTranform = (options: NgPackagrBuilderOptions): Transform => transformFromPromise(async graph => {
  if (!options.entries || !options.entries.length) {
    return;
  }

  const dependencyList: { dependencies?: string[] } = {
    dependencies: [],
  };
  for (const entry of graph.filter(isEntryPoint)) {
    const { dependencies = {}, peerDependencies = {} } = entry.data.entryPoint.packageJson;
    dependencyList.dependencies =
      dependencyList.dependencies!.concat(
        Object.keys(dependencies),
        Object.keys(peerDependencies),
        entry.data.entryPoint.moduleId,
      )
        .filter((value, index, self) => self.indexOf(value) === index);
  }

  const spinner = ora({
    hideCursor: false,
    discardStdin: false,
  });


  const entry: EntryPointNode = graph.find(isEntryPointInProgress());
  const cache = entry.cache;
  const { entryPoint: ngEntryPoint } = entry.data;
  const { esm2020 } = ngEntryPoint.destinationFiles;

  try {
    spinner.start('Reshuffling FESM2015');

    const bundle = await rollup({
      context: 'this',
      input: esm2020,
      external: moduleId => isExternalDependency(moduleId),
      cache: cache.rollupFESM2015Cache,
      plugins: [
        // @ts-ignore
        nodeResolve(),
        // @ts-ignore
        autoEntry({
          include: options.entries,
          scope: entry.data.destinationFiles.directory || EMPTY,
        }),
        // @ts-ignore
        rollupJson(),
        // @ts-ignore
        commonJs(),

      ],
      inlineDynamicImports: false,
      preserveSymlinks: true,
      treeshake: false,
      onwarn: warning => {
        switch (warning.code) {
          case 'UNUSED_EXTERNAL_IMPORT':
          case 'THIS_IS_UNDEFINED':
            break;

          default:
            log.warn(warning.message);
            break;
        }
      },
    })

    if (options.watch) {
      cache.rollupFESM2015Cache = bundle.cache;
    }

    await bundle.write({
      name: ngEntryPoint.moduleId,
      file: ngEntryPoint.destinationFiles.fesm2015,
      banner: '',
      format: 'es',
      sourcemap: true
    });

    spinner.succeed();

    await bundle.close()
  } catch (error) {
    spinner.fail();
    throw error;
  }

  try {
    spinner.start('Reshuffling FESM2020');

    const bundle = await rollup({
      context: 'this',
      input: esm2020,
      external: moduleId => isExternalDependency(moduleId),
      cache: cache.rollupFESM2020Cache,
      plugins: [
        // @ts-ignore
        nodeResolve(),
        // @ts-ignore
        autoEntry({
          include: options.entries,
          scope: entry.data.destinationFiles.directory || EMPTY,
        }),
        // @ts-ignore
        rollupJson(),
        // @ts-ignore
        commonJs(),


      ],
      onwarn: warning => {
        switch (warning.code) {
          case 'UNUSED_EXTERNAL_IMPORT':
          case 'THIS_IS_UNDEFINED':
            break;

          default:
            log.warn(warning.message);
            break;
        }
      },
      inlineDynamicImports: false,
      preserveSymlinks: true,
      treeshake: false,
    })

    if (options.watch) {
      cache.rollupFESM2020Cache = bundle.cache;
    }

    const { output } = await bundle.write({
      name: ngEntryPoint.moduleId,
      file: ngEntryPoint.destinationFiles.fesm2020,
      banner: '',
      format: 'es',
      sourcemap: true
    });
    // console.log('output', JSON.stringify(output, null, '\t'));
    // const emittedFiles = output.filter(o => o.type === 'chunk' && o.facadeModuleId)
    // const content = `export * from './${emittedFiles[0].fileName}';`;
    // await fs.writeFile(entry.data.destinationFiles.fesm2020, content);
    output; fs;
    spinner.succeed();

    await bundle.close()
  } catch (error) {
    spinner.fail();
    throw error;
  }

});

function isExternalDependency(moduleId: string): boolean {
  if (!moduleId) { return false; }

  // more information about why we don't check for 'node_modules' path
  // https://github.com/rollup/rollup-plugin-node-resolve/issues/110#issuecomment-350353632
  if (path.isAbsolute(moduleId) || moduleId.startsWith('.') || moduleId.startsWith('/')) {
    // if it's either 'absolute', marked to embed, starts with a '.' or '/' or is the umd bundle and is tslib
    return false;
  }

  return true;
}

export const providers = (options: NgPackagrBuilderOptions) => ([
  {
    provide: WRITE_BUNDLES_TRANSFORM_TOKEN,
    useFactory: function() {
      return pipe(
        writeBundlesTransform(options),
        overlayTranform(options),
      )
    },
  },
]);
