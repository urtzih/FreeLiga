export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones de Servicio</h1>
        <p className="text-gray-600 mb-6 text-sm">Última actualización: 28 de febrero de 2026</p>

        <div className="space-y-8">
          {/* 1. Aceptación */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700">
              Al acceder y usar FreeLiga, aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.
            </p>
          </section>

          {/* 2. Descripción del servicio */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 mb-4">
              FreeLiga es una plataforma digital para la gestión y seguimiento de ligas de squash, incluyendo:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Registro y administración de jugadores</li>
              <li>Gestión de partidos y resultados</li>
              <li>Cálculo de rankings</li>
              <li>Integración de calendario</li>
              <li>Reportes y estadísticas</li>
            </ul>
          </section>

          {/* 3. Cuenta de usuario */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Cuenta de Usuario</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Responsabilidad:</strong> Eres responsable de mantener la confidencialidad de tu contraseña</li>
              <li><strong>Información exacta:</strong> Debes proporcionar información precisa y actualizada</li>
              <li><strong>Uso autorizado:</strong> Solo tú puedes acceder a tu cuenta</li>
              <li><strong>Notificación:</strong> Avísanos inmediatamente de un acceso no autorizado</li>
              <li><strong>Eliminación:</strong> Puedes solicitar la eliminación de tu cuenta en cualquier momento</li>
            </ul>
          </section>

          {/* 4. Conducta aceptable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Conducta Aceptable</h2>
            <p className="text-gray-700 mb-4">No debes:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Proporcionar información falsa o fraudulenta</li>
              <li>Acceder a la plataforma de manera no autorizada</li>
              <li>Interferir con el funcionamiento del sistema</li>
              <li>Usar la plataforma para actividades ilegales</li>
              <li>Acosar, amenazar o insultar a otros usuarios</li>
              <li>Manipular resultados o estadísticas</li>
              <li>Compartir contenido ofensivo, obsceno o discriminatorio</li>
            </ul>
          </section>

          {/* 5. Resultados y datos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Integridad de Resultados y Datos</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Precisión:</strong> Solo participantes autorizados pueden registrar resultados</li>
              <li><strong>Verificación:</strong> Los administradores pueden verificar y corregir datos</li>
              <li><strong>Correcciones:</strong> Errores detectados serán corregidos rápidamente</li>
              <li><strong>Disputas:</strong> Serán resueltas por los administradores de la liga</li>
              <li><strong>Fraude:</strong> Puede resultar en suspensión o eliminación de cuenta</li>
            </ul>
          </section>

          {/* 6. Pagos y cuotas */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Pagos y Cuotas Anuales</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 space-y-3">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Responsabilidad:</strong> Cada jugador es responsable de sus propios pagos</li>
                <li><strong>Registro:</strong> Los pagos son registrados en el sistema</li>
                <li><strong>Disputas de pago:</strong> Contacta a los administradores</li>
                <li><strong>No reembolsable:</strong> Las cuotas pagadas no son reembolsables (excepto devolución legal)</li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-gray-700 font-semibold mb-2">⚖️ <strong>Pago = Aceptación de Términos</strong></p>
                <p className="text-gray-700 text-sm">
                  Al realizar el pago de la cuota anual del club, <strong>aceptas automáticamente estos Términos y Condiciones y la Política de Privacidad</strong>. 
                  El pago constituye acuerdo contractual explícito con todas las disposiciones descritas en este documento.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Limitación de Responsabilidad</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-gray-700 mb-4">
                <strong>DESCARGO DE RESPONSABILIDAD:</strong> La plataforma se proporciona "tal cual", sin garantías expresas o implícitas.
              </p>
              <p className="text-gray-700 mb-4">
                En la máxima medida permitida por la ley, no somos responsables por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Pérdida de datos o acceso no autorizado</li>
                <li>Interrupciones del servicio o disponibilidad</li>
                <li>Errores o inexactitudes en resultados</li>
                <li>Pérdidas económicas resultantes del uso</li>
                <li>Daños indirectos, incidentales o consecuentes</li>
              </ul>
            </div>
          </section>

          {/* 8. Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Propiedad Intelectual</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Plataforma:</strong> Todo código, diseño y contenido es propiedad de FreeLiga</li>
              <li><strong>Datos de usuario:</strong> Tus datos personales son tuyos; la plataforma solo los almacena</li>
              <li><strong>Licencia:</strong> Se te otorga licencia limitada para usar la plataforma</li>
              <li><strong>Restricciones:</strong> No puedes copiar, modificar o distribuir el código</li>
            </ul>
          </section>

          {/* 9. Modificaciones */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Modificaciones del Servicio</h2>
            <p className="text-gray-700">
              Podemos modificar o suspender el servicio en cualquier momento. Notificaremos cambios significativos. No seremos responsables por cualquier modificación.
            </p>
          </section>

          {/* 10. Suspensión */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Suspensión de Cuenta</h2>
            <p className="text-gray-700 mb-4">
              Podemos suspender o eliminar tu cuenta si:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Violas estos términos</li>
              <li>Proporcionas información falsa</li>
              <li>Te comportas de manera inapropiada</li>
              <li>Manipulas resultados</li>
              <li>Incumples pagos de cuotas (según políticas de la liga)</li>
            </ul>
          </section>

          {/* 11. Indemnización */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Indemnización</h2>
            <p className="text-gray-700">
              Aceptas indemnizar y defender a FreeLiga contra cualquier reclamación, demanda o gasto que surja de: (a) tu uso de la plataforma, (b) violación de estos términos, o (c) tu incumplimiento de leyes aplicables.
            </p>
          </section>

          {/* 12. Ley aplicable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Ley Aplicable</h2>
            <p className="text-gray-700">
              Estos términos se rigen por las leyes de <strong>España</strong>. Cualquier disputa se resolverá en los tribunales correspondientes.
            </p>
          </section>

          {/* 13. Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Contacto</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700 mb-2"><strong>Preguntas sobre estos términos:</strong></p>
              <p className="text-gray-700">email: legal@freeligaapp.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
