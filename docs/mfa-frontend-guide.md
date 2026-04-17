# 🔐 Guia de Integração MFA (Multi-Factor Authentication)

Este documento descreve as mudanças necessárias no Frontend para suportar a nova política de segurança: **MFA Opcional para Usuários e Obrigatório para Admins**.

## 1. Fluxo de Autenticação Atualizado

Após o login bem-sucedido (`supabase.auth.signInWithPassword`), o sistema deve verificar se o usuário precisa concluir o setup do MFA.

### Verificação de Conformidade
Chame a Edge Function `enforce-mfa` logo após obter a sessão:

```typescript
const { data, error } = await supabase.functions.invoke('enforce-mfa');

if (data?.error === 'mfa_required') {
  // Redirecionar para a página de configuração do MFA
  navigate('/mfa-setup');
}
```

## 2. Implementação do Setup MFA (Enrollment)

Para usuários que desejam ativar ou Admins obrigados, utilize os métodos nativos do `@supabase/supabase-js`.

### Passo A: Gerar QR Code (Enroll)
```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  issuer: 'Celo Tracker',
  friendlyName: 'Meu Dispositivo Principal'
});

// data.totp.qr_code contém a imagem em base64 do QR Code para exibir ao usuário
// data.id é o factorId necessário para o próximo passo
```

### Passo B: Validar e Ativar (Challenge + Verify)
O usuário deve inserir o código de 6 dígitos gerado pelo App (Google Authenticator/Authy).

```typescript
// 1. Criar o desafio
const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
  factorId: factor.id
});

// 2. Verificar o código inserido pelo usuário (code)
const { data: verify, error: verifyError } = await supabase.auth.mfa.verify({
  factorId: factor.id,
  challengeId: challenge.id,
  code: userSubmittedCode
});

if (verify.data) {
  // MFA Habilitado com sucesso!
}
```

## 3. Login com MFA (Challenge)

Se o usuário já tem MFA, o login comum retornará um `aal: aal1`. O frontend deve detectar se há necessidade de `aal2` (MFA verificado).

```typescript
const { data: { factors }, error } = await supabase.auth.mfa.listFactors();
const verifiedFactors = factors.filter(f => f.status === 'verified');

if (verifiedFactors.length > 0) {
  // Criar challenge e pedir o código
}
```

## 4. Resumo de Métodos Úteis

| Método | Finalidade |
| :--- | :--- |
| `mfa.listFactors()` | Lista os métodos cadastrados do usuário. |
| `mfa.enroll()` | Inicia o cadastro de um novo fator (gera QR Code). |
| `mfa.verify()` | Valida o código do app e "venera" (ativa) o fator. |
| `mfa.unenroll()` | Remove um fator (exige senha ou nível AAL2). |

> [!IMPORTANT]
> A Edge Function `enforce-mfa` registra automaticamente tentativas de bypass em `audit_logs` como `MFA_BLOCKED`.
