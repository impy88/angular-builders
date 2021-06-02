import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { resolve } from 'path';
import { Observable, from } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import { NgPackagrBuilderOptions } from './schema';
import { providers } from './providers';

// Include schema in bundle
import './schema.json';

export async function initialize(
  options: NgPackagrBuilderOptions,
  root: string,
): Promise<import('ng-packagr').NgPackagr> {
  const packager = (await import('ng-packagr')).ngPackagr();

  packager.forProject(resolve(root, options.project));

  if (options.tsConfig) {
    packager.withTsConfig(resolve(root, options.tsConfig));
  }

  packager.withProviders(providers(options));

  return packager;
}

/**
 * @experimental Direct usage of this function is considered experimental.
 */
export function execute(
  options: NgPackagrBuilderOptions,
  context: BuilderContext,
): Observable<BuilderOutput> {
  return from(initialize(options, context.workspaceRoot)).pipe(
    switchMap((packager) => (options.watch ? packager.watch() : packager.build())),
    mapTo({ success: true }),
  );
}

export { NgPackagrBuilderOptions };
export default createBuilder<Record<string, string> & NgPackagrBuilderOptions>(execute);
