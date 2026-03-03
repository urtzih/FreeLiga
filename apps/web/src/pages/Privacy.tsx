export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        <p className="text-gray-600 mb-6 text-sm">Última actualización: 28 de febrero de 2026</p>

        <div className="space-y-8">
          {/* 1. Responsable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Responsable del Tratamiento</h2>
            <p className="text-gray-700 mb-4">
              <strong>FreeLiga</strong> es responsable del tratamiento de tus datos personales.
            </p>
            <p className="text-gray-700">
              Para consultas sobre privacidad, contacta a: <strong>privacy@freeligaapp.com</strong>
            </p>
          </section>

          {/* 2. ¿Qué datos recopilamos? */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Datos que Recopilamos</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Datos que proporcionas directamente:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Email y contraseña</strong> - Para autenticación en la plataforma</li>
                <li><strong>Nombre completo y apodo</strong> - Para registros de competición</li>
                <li><strong>Teléfono</strong> - Para coordinación de partidos y contacto</li>
                <li><strong>Información del calendario</strong> - Si autorizas acceso a Google Calendar</li>
                <li><strong>Suscripción a notificaciones push</strong> - Si activas las notificaciones en tu perfil (incluye endpoint de navegador e información de suscripción)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Datos generados automáticamente:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Resultados de partidos</strong> - Para estadísticas y rankings</li>
                <li><strong>Información de grupos</strong> - Para gestión de temporadas</li>
                <li><strong>Cuotas pagadas</strong> - Para registro de pagos</li>
                <li><strong>Fecha/hora de última conexión</strong> - Para análisis de uso</li>
                <li><strong>Reportes de bugs</strong> - Si reportas problemas técnicos</li>
              </ul>
            </div>
          </section>

          {/* 3. Base legal */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Base Legal para el Tratamiento</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left font-semibold">Tipo de Datos</th>
                  <th className="border p-3 text-left font-semibold">Base Legal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Email, contraseña, nombre</td>
                  <td className="border p-3">Ejecución del contrato de servicio</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3">Estadísticas y resultados</td>
                  <td className="border p-3">Interés legítimo (gestión de la liga)</td>
                </tr>
                <tr>
                  <td className="border p-3">Acceso a Google Calendar</td>
                  <td className="border p-3">Consentimiento explícito (puedes revocar)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3">Notificaciones Push</td>
                  <td className="border p-3">Consentimiento (activadas por defecto al pagar cuota, puedes desactivar en tu perfil)</td>
                </tr>
                <tr>
                  <td className="border p-3">Reportes de bugs</td>
                  <td className="border p-3">Consentimiento (opcional)</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 4. Conservación de datos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Período de Retención de Datos</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Datos de cuenta:</strong> Mientras tu cuenta esté activa + 30 días después de eliminación</li>
              <li><strong>Resultados de partidos:</strong> Indefinidamente (historial competitivo)</li>
              <li><strong>Logs de error/reportes de bugs:</strong> 90 días</li>
              <li><strong>Tokens de Google Calendar:</strong> Mientras los autorices</li>
              <li><strong>Datos de pago:</strong> 3 años (cumplimiento legal fiscal)</li>
              <li><strong>Registro de aceptación de términos:</strong> Indefinidamente (auditoría legal)</li>
            </ul>
          </section>

          {/* 4.5 Consentimiento mediante pago */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4.5 Consentimiento a través del Pago de Cuota</h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-gray-700 mb-3">
                Como club privado, registramos automáticamente tu aceptación de esta Política de Privacidad y los Términos de Servicio cuando realizas el pago de la cuota anual.
              </p>
              <p className="text-gray-700 text-sm">
                <strong>¿Qué significa?</strong> Al pagar tu cuota, confirmas que has leído y aceptas:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2 text-sm">
                <li>Esta Política de Privacidad</li>
                <li>Los Términos y Condiciones</li>
                <li>El procesamiento de tus datos personales necesario para la liga</li>
                <li>El uso de tus datos para estadísticas y rankings</li>
                 <li>La activación por defecto de notificaciones push (puedes desactivarlas en tu perfil en cualquier momento)</li>
              </ul>
               <p className="text-gray-700 text-xs mt-3">
                 <strong>Notificaciones Push:</strong> Al pagar tu cuota, las notificaciones push se activan automáticamente por defecto. Sin embargo, puedes desactivarlas en cualquier momento desde tu perfil. Las notificaciones te mantienen informado sobre nuevas temporadas, partidos y actualizaciones importantes.
               </p>
              <p className="text-gray-700 text-xs mt-3 italic">
                 Esta aceptación se registra para cumplimiento legal y auditoría.
              </p>
            </div>
          </section>

          {/* 5. Compartir datos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. ¿Con Quién Compartimos tus Datos?</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Otros jugadores:</strong> Ven tu nombre, ranking y resultados (necesario para la liga)</li>
              <li><strong>Administradores:</strong> Acceso completo para gestión de temporada</li>
              <li><strong>Proveedores de servicios:</strong>
                <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                  <li>Railway (hosting de base de datos)</li>
                  <li>Google (si autorizas calendario)</li>
                  <li>Proveedores de email para notificaciones</li>
                </ul>
              </li>
              <li><strong>Autoridades legales:</strong> Solo si legalmente requerido</li>
            </ul>
          </section>

          {/* 6. Tus derechos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Tus Derechos RGPD</h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 space-y-2">
              <p className="text-gray-700"><strong>Derecho de acceso:</strong> Puedes solicitar una copia de todos tus datos</p>
              <p className="text-gray-700"><strong>Derecho de rectificación:</strong> Corregir datos incorrectos</p>
              <p className="text-gray-700"><strong>Derecho al olvido:</strong> Solicitar eliminación completa de tus datos</p>
              <p className="text-gray-700"><strong>Derecho de oposición:</strong> Rechazar ciertos tratamientos</p>
              <p className="text-gray-700"><strong>Portabilidad:</strong> Solicitar tus datos en formato legible</p>
              <p className="text-sm text-gray-600 mt-4">
                Para ejercer estos derechos, contacta a: <strong>privacy@freeligaapp.com</strong>
              </p>
            </div>
          </section>

          {/* 7. Seguridad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Seguridad de los Datos</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Contraseñas hasheadas con bcrypt (no reversibles)</li>
              <li>Conexiones HTTPS/TLS encriptadas</li>
              <li>Base de datos con control de acceso</li>
              <li>Backups automáticos encriptados</li>
              <li>Monitoreo de logs de seguridad</li>
            </ul>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-700">
              Utilizamos cookies de sesión para mantener tu autenticación. No usamos cookies de rastreo/publicidad.
            </p>
          </section>

          {/* 9. Cambios */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Cambios a esta Política</h2>
            <p className="text-gray-700">
              Podemos actualizar esta política. Los cambios significativos serán notificados por email.
            </p>
          </section>

          {/* 10. Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contacto</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700 mb-2"><strong>Preguntas sobre privacidad:</strong></p>
              <p className="text-gray-700 mb-4">email: privacy@freeligaapp.com</p>
              <p className="text-gray-700 mb-2"><strong>Autoridad de Protección de Datos (España):</strong></p>
              <p className="text-gray-700">AEPD - www.aepd.es</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
