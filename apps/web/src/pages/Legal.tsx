export default function Legal() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Aviso Legal</h1>
        <p className="text-gray-600 mb-6 text-sm">Última actualización: 28 de febrero de 2026</p>

        <div className="space-y-8">
          {/* 1. Información general */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Información General</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-700 mb-2"><strong>Titular del sitio:</strong> FreeLiga</p>
              <p className="text-gray-700 mb-2"><strong>Tipo de actividad:</strong> Plataforma de gestión de ligas deportivas</p>
              <p className="text-gray-700 mb-2"><strong>Email de contacto:</strong> info@freeligaapp.com</p>
              <p className="text-gray-700"><strong>Responsable legal:</strong> Administrador de FreeLiga</p>
            </div>
          </section>

          {/* 2. Uso del sitio */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Condiciones de Uso</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>El acceso a FreeLiga es gratuito, aunque pueden aplicarse cuotas de membresía en la liga</li>
              <li>Debes ser mayor de 18 años para usar la plataforma</li>
              <li>Aceptas cumplir todas las leyes aplicables</li>
              <li>No debes causar daño a la plataforma o a otros usuarios</li>
              <li>El administrador se reserva el derecho a modificar o eliminar contenido</li>
            </ul>
          </section>

          {/* 3. Acceso y disponibilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Acceso y Disponibilidad del Servicio</h2>
            <p className="text-gray-700 mb-4">
              Aunque intentamos mantener el servicio disponible 24/7, no garantizamos disponibilidad continua.
            </p>
            <p className="text-gray-700">
              Podemos realizar mantenimiento, actualizaciones o interrupciones sin aviso previo. No seremos responsables por cualquier pérdida resultante de indisponibilidad del servicio.
            </p>
          </section>

          {/* 4. Enlaces externos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Enlaces Externos</h2>
            <p className="text-gray-700 mb-4">
              FreeLiga puede contener enlaces a sitios externos. No somos responsables por:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Contenido de sitios externos</li>
              <li>Prácticas de privacidad de terceros</li>
              <li>Disponibilidad o precisión de información externa</li>
              <li>Cualquier software o malware en sitios enlazados</li>
            </ul>
          </section>

          {/* 5. Contenido generado por usuarios */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Contenido Generado por Usuarios</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Responsabilidad:</strong> Eres responsable de todo contenido que subas (reportes, comentarios, etc.)</li>
              <li><strong>Licencia:</strong> Al subir contenido, nos autorizas a usarlo en la plataforma</li>
              <li><strong>Prohibido:</strong> No puedes subir contenido ilegal, ofensivo o que viole derechos de terceros</li>
              <li><strong>Remoción:</strong> Podemos eliminar contenido que viole estas condiciones</li>
            </ul>
          </section>

          {/* 6. Protección de datos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Protección de Datos</h2>
            <p className="text-gray-700">
              Consulta nuestra <strong>Política de Privacidad</strong> para información completa sobre cómo recogemos, usamos y protegemos tus datos personales.
            </p>
          </section>

          {/* 7. Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Propiedad Intelectual</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Derechos de autor:</strong> © FreeLiga. Todos los derechos reservados.</li>
              <li><strong>Marca:</strong> FreeLiga™ es marca registrada</li>
              <li><strong>Software:</strong> El código fuente es propiedad intelectual de FreeLiga</li>
              <li><strong>Prohibido:</strong> No puedes copiar, reproducir o distribuir sin autorización expresa</li>
            </ul>
          </section>

          {/* 8. Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Exención de Responsabilidad</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-gray-700 mb-4">
                <strong>LA PLATAFORMA SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD"</strong>
              </p>
              <p className="text-gray-700 mb-4">
                Hasta la máxima medida permitida por ley, FreeLiga no ofrece ninguna garantía:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Sobre la precisión, integridad o utilidad del servicio</li>
                <li>De que el servicio será ininterrumpido o libre de errores</li>
                <li>Que los problemas serán corregidos</li>
                <li>Que el servicio cumplirá tus requisitos específicos</li>
              </ul>
            </div>
          </section>

          {/* 9. Limitación de daños */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Limitación de Daños</h2>
            <p className="text-gray-700 mb-4">
              En ningún caso FreeLiga será responsable por daños:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Indirectos, incidentales, especiales o consecuentes</li>
              <li>Incluida pérdida de datos, ingresos o ganancias</li>
              <li>Resultante de cualquier causa de acción</li>
            </ul>
            <p className="text-gray-700 mt-4">
              <strong>Responsabilidad total máxima:</strong> Limitada al monto pagado por cuotas (si aplica), en los últimos 12 meses.
            </p>
          </section>

          {/* 10. Indemnización */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Indemnización</h2>
            <p className="text-gray-700">
              Aceptas indemnizar, defender y mantener indemne a FreeLiga, sus propietarios, y empleados contra cualquier reclamación, demanda, obligación, pérdida, daño, gasto o costo (incluidos honorarios legales) resultante de:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li>Tu uso de la plataforma</li>
              <li>Tu violación de estos términos</li>
              <li>Tu incumplimiento de leyes aplicables</li>
              <li>Tu violación de derechos de terceros</li>
            </ul>
          </section>

          {/* 11. Modificaciones de términos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Modificaciones</h2>
            <p className="text-gray-700">
              Podemos modificar este aviso legal en cualquier momento. Los cambios entran en vigor inmediatamente. Tu uso continuado de la plataforma implica aceptación de los términos modificados.
            </p>
          </section>

          {/* 12. Ley aplicable y jurisdicción */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700 mb-4">
              Este aviso se rige por las leyes de <strong>España</strong>, sin consideración de sus conflictos de ley.
            </p>
            <p className="text-gray-700">
              Cualquier acción legal o procedimiento será exclusivamente en tribunales de España.
            </p>
          </section>

          {/* 13. Severabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Separabilidad</h2>
            <p className="text-gray-700">
              Si alguna parte de este aviso es inválida, el resto permanece en vigor.
            </p>
          </section>

          {/* 14. Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Contacto</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700 mb-2"><strong>Consultas legales:</strong></p>
              <p className="text-gray-700">email: legal@freeligaapp.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
