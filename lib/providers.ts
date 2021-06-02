import { default as ora } from 'ora';

import { promises as fs } from 'fs';
import * as path from 'path';

import { WRITE_BUNDLES_TRANSFORM_TOKEN } from 'ng-packagr/lib/ng-package/entry-point/write-bundles.di';
import { writeBundlesTransform } from 'ng-packagr/lib/ng-package/entry-point/write-bundles.transform';
import { Transform, transformFromPromise } from 'ng-packagr/lib/graph/transform';
import { DependencyList, ExternalModuleIdStrategy } from 'ng-packagr/lib/flatten/external-module-id-strategy';
import { isEntryPoint } from 'ng-packagr/lib/ng-package/nodes';
import { pipe } from 'rxjs';

import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import commonJs from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';
import autoEntry from 'rollup-plugin-auto-entry';

import { NgPackagrBuilderOptions } from './schema';

const overlayTranform = (options: NgPackagrBuilderOptions): Transform => transformFromPromise(async graph => {
  if (!options.entries || !options.entries.length) {
    return;
  }

  const dependencyList: DependencyList = {
    dependencies: [],
    bundledDependencies: [],
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

  const externalModuleIdStrategy = new ExternalModuleIdStrategy("esm", dependencyList);

  const spinner = ora({
    hideCursor: false,
    discardStdin: false,
  });


  for (const entry of graph.filter(isEntryPoint)) {
    const cache = entry.cache;


    const { entryPoint: ngEntryPoint } = entry.data;

    try {

      spinner.start('Reshuffling FESM2015');

      const bundle = await rollup({
        context: 'this',
        input: entry.data.destinationFiles.esm2015,
        external: moduleId => externalModuleIdStrategy.isExternalDependency(moduleId),
        cache: cache.rollupFESMCache,
        plugins: [
          // @ts-ignore
          nodeResolve(),

          // @ts-ignore
          autoEntry({
            include: options.entries,
          }),
          // @ts-ignore
          rollupJson(),
          // @ts-ignore
          nodeResolve(),
          // @ts-ignore
          commonJs(),
          // @ts-ignore
          sourcemaps(),

        ],
        inlineDynamicImports: false,
        preserveSymlinks: true,
        treeshake: false,
      })

      cache.rollupFESMCache = bundle.cache;

      bundle.write({
        name: ngEntryPoint.moduleId,
        dir: ngEntryPoint.destinationPath,
        banner: '',
        format: 'es',
        sourcemap: true
      })


      const content = `export * from '../${path.basename(entry.data.destinationFiles.fesm2015)}';`
      await fs.writeFile(entry.data.destinationFiles.fesm2015, content);

      spinner.succeed();

      await bundle.close()
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }

});


export const providers = (options: NgPackagrBuilderOptions) => ([
  {
    provide: WRITE_BUNDLES_TRANSFORM_TOKEN,
    useFactory: function() {
      return pipe(
        writeBundlesTransform,
        overlayTranform(options),
      )
    },
  },
]);
