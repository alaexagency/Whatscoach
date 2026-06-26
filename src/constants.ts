// =============================================
// ENUMS
// =============================================

export enum UserRole {
  Admin    = 'admin',
  Company  = 'company',
  Vendedor = 'vendedor',
}

export enum MessageRole {
  Vendedor = 'vendedor',
  Cliente  = 'cliente',
}

export enum ClientProfileKey {
  Skeptical      = 'skeptical',
  PriceSensitive = 'price_sensitive',
  Busy           = 'busy',
  Analytical     = 'analytical',
  Emotional      = 'emotional',
  Ghost          = 'ghost',
}

export enum Difficulty {
  Easy   = 'easy',
  Medium = 'medium',
  Hard   = 'hard',
}

// =============================================
// LABELS DE ROLES
// =============================================

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]:    'Administrador',
  [UserRole.Company]:  'Empresa',
  [UserRole.Vendedor]: 'Vendedor',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.Admin]:    'bg-purple-100 text-purple-700',
  [UserRole.Company]:  'bg-blue-100 text-blue-700',
  [UserRole.Vendedor]: 'bg-emerald-100 text-emerald-700',
}

export const ROLE_BANNER: Record<UserRole, string> = {
  [UserRole.Admin]:    '⚙️ Vista de administrador — estás viendo datos de toda la plataforma.',
  [UserRole.Company]:  '🏢 Vista de empresa — estás viendo las sesiones de tu equipo.',
  [UserRole.Vendedor]: '',
}

// =============================================
// LABELS DE PERFILES DE CLIENTE
// =============================================

export const CLIENT_PROFILE_NAMES: Record<ClientProfileKey, string> = {
  [ClientProfileKey.Skeptical]:      'Carlos Escéptico',
  [ClientProfileKey.PriceSensitive]: 'María Precio',
  [ClientProfileKey.Busy]:           'Andrea Ocupada',
  [ClientProfileKey.Analytical]:     'Roberto Analítico',
  [ClientProfileKey.Emotional]:      'Laura Emocional',
  [ClientProfileKey.Ghost]:          'Diego Fantasma',
}

export const CLIENT_PROFILE_EMOJIS: Record<ClientProfileKey, string> = {
  [ClientProfileKey.Skeptical]:      '🤨',
  [ClientProfileKey.PriceSensitive]: '💰',
  [ClientProfileKey.Busy]:           '⏰',
  [ClientProfileKey.Analytical]:     '📊',
  [ClientProfileKey.Emotional]:      '❤️',
  [ClientProfileKey.Ghost]:          '👻',
}

export const CLIENT_PROFILE_DESCS: Record<ClientProfileKey, string> = {
  [ClientProfileKey.Skeptical]:      'Exige pruebas y desconfía',
  [ClientProfileKey.PriceSensitive]: 'Siempre busca descuentos',
  [ClientProfileKey.Busy]:           'No tiene tiempo para nada',
  [ClientProfileKey.Analytical]:     'Decide solo con datos',
  [ClientProfileKey.Emotional]:      'Necesita conexión humana',
  [ClientProfileKey.Ghost]:          'Desaparece sin responder',
}

// =============================================
// LABELS DE DIFICULTAD
// =============================================

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.Easy]:   'Principiante',
  [Difficulty.Medium]: 'Intermedio',
  [Difficulty.Hard]:   'Avanzado',
}

// =============================================
// MENSAJES UI
// =============================================

export const UI_MESSAGES = {
  auth: {
    signIn:              'Iniciar sesión',
    signUp:              'Crear cuenta',
    resetPassword:       'Recuperar contraseña',
    sendLink:            'Enviar enlace',
    continueWithGoogle:  'Continuar con Google',
    backToSignIn:        '← Volver a iniciar sesión',
    noAccount:           '¿No tienes cuenta?',
    hasAccount:          '¿Ya tienes cuenta?',
    forgotPassword:      '¿Olvidaste tu contraseña?',
    checkEmail:          'Revisa tu correo para confirmar tu cuenta.',
    resetLinkSent:       'Te enviamos un enlace para restablecer tu contraseña.',
    loading:             'Cargando...',
    register:            'Regístrate',
    signInLink:          'Inicia sesión',
    maintenance:         'La plataforma está en mantenimiento. El registro está temporalmente deshabilitado.',
  },
  profile: {
    title:               'Mi perfil',
    personalInfo:        'Información personal',
    fullName:            'Nombre completo',
    email:               'Correo electrónico',
    saveChanges:         'Guardar cambios',
    saving:              'Guardando...',
    saved:               '¡Guardado! ✓',
    changePassword:      'Cambiar contraseña',
    newPassword:         'Nueva contraseña',
    confirmPassword:     'Confirmar contraseña',
    updatePassword:      'Actualizar contraseña',
    updating:            'Actualizando...',
    passwordMismatch:    'Las contraseñas no coinciden.',
    passwordTooShort:    'Mínimo 6 caracteres.',
    passwordUpdated:     'Contraseña actualizada correctamente.',
    saveError:           'No se pudo guardar. Intenta de nuevo.',
    memberSince:         'Miembro desde',
    role:                'Rol',
    account:             'Cuenta',
    noName:              'Sin nombre',
  },
  dashboard: {
    welcome:             'Bienvenido 👋',
    activitySummary:     'Aquí está el resumen de tu actividad.',
    newSimulation:       'Nueva simulación',
    recentSessions:      'Simulaciones recientes',
    goToSimulator:       'Ver simulador',
    noSessions:          'No hay simulaciones aún.',
    startFirst:          'Iniciar primera simulación →',
    noScore:             'Sin evaluar',
    statSessions:        'Simulaciones',
    statEvaluations:     'Evaluaciones',
    statAvgScore:        'Score promedio',
    statFinalScore:      'puntuación final',
    subPlatform:         'en la plataforma',
    subTeam:             'de tu equipo',
    subOwn:              'realizadas',
    subCompleted:        'completadas',
    signOut:             'Cerrar sesión',
  },
  simulator: {
    dashboard:           'Dashboard',
    signOut:             'Salir',
    online:              'En línea',
    service:             'Servicio',
    manuals:             'Manuales',
    exportChat:          'Exportar Chat',
    discard:             'Descartar',
  },
  errors: {
    domainNotAllowed:    (domain: string) => `Solo se permiten registros con correos @${domain}`,
    minMessages:         'Debes intercambiar al menos un par de mensajes para poder evaluar.',
  },
} as const
