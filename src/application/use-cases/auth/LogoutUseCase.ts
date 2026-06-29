export class LogoutUseCase {
  async execute(): Promise<{ message: string }> {
    return { message: 'Sesión cerrada exitosamente' };
  }
}
