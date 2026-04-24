export function PlanoGuard({ children }: { children: React.ReactNode }) {
  // Acesso ao dashboard agora é liberado para todos os usuários.
  // Restrições de recursos (como OCR) são tratadas individualmente.
  return <>{children}</>
}
