// Datos públicos del taller de demostración. La demo vive en el mismo
// despliegue que producción, como un taller más (ADR-0016): su aislamiento es
// por fila (`tenant_id`), no por stack.
//
// Las credenciales son FIJAS y se publican a propósito: quien entra solo a
// probar no tiene que pedirlas. El reset periódico borra los datos de negocio
// del taller `demo`, nunca sus usuarios, así que estas credenciales no cambian.
export const DEMO_TENANT = 'demo'
export const DEMO_USERNAME = 'demo'
export const DEMO_PASSWORD = 'demo12345'
