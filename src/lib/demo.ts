// Datos públicos del taller de demostración. La demo vive en el mismo
// despliegue que producción, como un taller más (ADR-016): su aislamiento es
// por fila (`tenant_id`), no por stack. Desde ADR-018 hay un único taller de
// demostración, `demotaller` ("Talleres del Sur"), tanto en desarrollo como en
// producción (ADR-020); no hay una lista de slugs por entorno.
//
// Las credenciales son FIJAS y se publican a propósito: quien entra solo a
// probar no tiene que pedirlas. El reset periódico borra los datos de negocio
// del taller, nunca sus usuarios, así que estas credenciales no cambian.
export const DEMO_TENANTS = ['demotaller'] as const
export const DEMO_EMAIL = 'demo@example.com'
export const DEMO_PASSWORD = 'demo12345'
