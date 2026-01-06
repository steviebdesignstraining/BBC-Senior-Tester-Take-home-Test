import { test } from '@playwright/test';

/**
 * Decorator function for wrapping POM methods in a test.step.
 *
 *     updated decorators, Harshal Tambat (1 month ago)
 *
 * Use it without a step name `@step()`.
 *
 * Or with a step name `@step("Search something")`.
 *
 * @param stepName - The name of the test step.
 * @returns A decorator function that can be used to decorate test methods.
 */
export function step(stepName?: string) {
  return function decorator(
    target: Function,
    context: ClassMethodDecoratorContext
  ) {
    return function replacementMethod(this: any, ...args: any) {
      const name = `${stepName || (context.name as string)} (${this.constructor.name})`
      return test.step(name, async () => {
        return await target.call(this, ...args)
      })
    }
  }
}