/**
 * Injectable decorator - marks a class as injectable
 * This is a marker decorator for documentation and potential future use
 * In this simple DI implementation, all registered classes are injectable
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Injectable(): (target: any) => any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    // Mark the class as injectable
    target.__injectable__ = true;
    return target;
  };
}

/**
 * Inject decorator - marks a constructor parameter for injection
 * Note: This is for documentation purposes. Actual injection happens via container registration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Inject(_token: string | symbol): ParameterDecorator {
  return () => {
    // No-op: injection is handled by the container
  };
}
