#!/usr/bin/env node
/**
 * Generador de Dashboard HTML para logs
 * Crea un reporte visual con estadísticas y gráficas
 */

import * as fs from 'fs';
import * as path from 'path';
import { LogAnalyzer } from './analyze-logs';

async function generateDashboard() {
  const analyzer = new LogAnalyzer();

  console.log('📊 Generando dashboard de logs...');

  // Recolectar datos
  const [events, errors, performance, users, timeline] = await Promise.all([
    analyzer.businessEventStats(),
    analyzer.errorAnalysis(),
    analyzer.performanceMetrics(),
    analyzer.userActivity(),
    analyzer.timeline(),
  ]);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FreeSquash - Dashboard de Logs</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #667eea;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        .stat:last-child {
            border-bottom: none;
        }
        .stat-label {
            font-weight: 500;
        }
        .stat-value {
            font-weight: 700;
            color: #667eea;
        }
        .error-stat {
            color: #e74c3c;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }
        .metric-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }
        .metric-row.header {
            font-weight: 700;
            background: #f8f9fa;
            border-radius: 5px;
            padding: 10px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: #667eea;
            color: white;
        }
        .badge.error {
            background: #e74c3c;
        }
        .badge.warning {
            background: #f39c12;
        }
        .badge.success {
            background: #27ae60;
        }
        .timestamp {
            color: #999;
            font-size: 12px;
            text-align: right;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FreeSquash - Dashboard de Logs</h1>
            <p>Análisis en tiempo real del sistema de logging estructurado</p>
        </div>

        <!-- Resumen -->
        <div class="grid">
            <div class="card">
                <h2>📊 Eventos de Negocio</h2>
                ${generateEventsSummary(events)}
            </div>
            <div class="card">
                <h2>🚨 Errores</h2>
                ${generateErrorsSummary(errors)}
            </div>
            <div class="card">
                <h2>👥 Usuarios Activos</h2>
                ${generateUsersSummary(users)}
            </div>
        </div>

        <!-- Gráficas -->
        <div class="grid">
            <div class="card" style="grid-column: span 2;">
                <h2>📅 Timeline de Actividad</h2>
                <div class="chart-container">
                    <canvas id="timelineChart"></canvas>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>🎯 Distribución de Eventos</h2>
                <div class="chart-container">
                    <canvas id="eventsChart"></canvas>
                </div>
            </div>
            <div class="card">
                <h2>⚡ Performance</h2>
                ${generatePerformanceTable(performance)}
            </div>
        </div>

        <!-- Top Errores -->
        <div class="card">
            <h2>🔍 Errores Detallados</h2>
            ${generateErrorsTable(errors)}
        </div>

        <p class="timestamp">Generado: ${new Date().toLocaleString('es-ES')}</p>
    </div>

    <script>
        // Timeline Chart
        const timelineData = ${JSON.stringify(timeline)};
        const timelineLabels = Object.keys(timelineData);
        const timelineEvents = timelineLabels.map(d => timelineData[d].events);
        const timelineErrors = timelineLabels.map(d => timelineData[d].errors);
        const timelineRequests = timelineLabels.map(d => timelineData[d].requests);

        new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [
                    {
                        label: 'Eventos',
                        data: timelineEvents,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Errores',
                        data: timelineErrors,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Requests',
                        data: timelineRequests,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Events Distribution Chart
        const eventsData = ${JSON.stringify(events)};
        const eventNames = Object.keys(eventsData);
        const eventCounts = eventNames.map(e => eventsData[e].count);

        new Chart(document.getElementById('eventsChart'), {
            type: 'doughnut',
            data: {
                labels: eventNames,
                datasets: [{
                    data: eventCounts,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#43e97b',
                        '#fa709a',
                        '#fee140',
                        '#30cfd0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    </script>
</body>
</html>
  `;

  // Guardar HTML
  const outputPath = path.join(process.cwd(), 'logs', 'dashboard.html');
  fs.writeFileSync(outputPath, html.trim());

  console.log(`✅ Dashboard generado: ${outputPath}`);
  console.log(`   Abre el archivo en tu navegador para ver el dashboard.`);
}

function generateEventsSummary(events: any): string {
  const total = Object.values(events).reduce((sum: number, e: any) => sum + e.count, 0);
  const topEvents = Object.entries(events)
    .sort(([, a]: any, [, b]: any) => b.count - a.count)
    .slice(0, 5);

  return `
    <div class="stat">
      <span class="stat-label">Total de eventos</span>
      <span class="stat-value">${total}</span>
    </div>
    ${topEvents.map(([name, data]: any) => `
      <div class="stat">
        <span class="stat-label">${name}</span>
        <span class="stat-value">${data.count}</span>
      </div>
    `).join('')}
  `;
}

function generateErrorsSummary(errors: any): string {
  const total = Object.values(errors).reduce((sum: number, e: any) => sum + e.count, 0);
  const topErrors = Object.entries(errors)
    .sort(([, a]: any, [, b]: any) => b.count - a.count)
    .slice(0, 3);

  if (total === 0) {
    return `<div class="stat"><span class="stat-label">Sin errores</span><span class="stat-value badge success">✓</span></div>`;
  }

  return `
    <div class="stat">
      <span class="stat-label">Total de errores</span>
      <span class="stat-value error-stat">${total}</span>
    </div>
    ${topErrors.map(([name, data]: any) => `
      <div class="stat">
        <span class="stat-label">${name.substring(0, 30)}...</span>
        <span class="stat-value error-stat">${data.count}</span>
      </div>
    `).join('')}
  `;
}

function generateUsersSummary(users: any): string {
  const userIds = Object.keys(users);
  const totalRequests = Object.values(users).reduce((sum: number, u: any) => sum + u.requests, 0);
  const topUsers = Object.entries(users)
    .sort(([, a]: any, [, b]: any) => b.requests - a.requests)
    .slice(0, 5);

  return `
    <div class="stat">
      <span class="stat-label">Usuarios únicos</span>
      <span class="stat-value">${userIds.length}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Total requests</span>
      <span class="stat-value">${totalRequests}</span>
    </div>
    ${topUsers.map(([userId, data]: any) => `
      <div class="stat">
        <span class="stat-label">Usuario #${userId}</span>
        <span class="stat-value">${data.requests} req</span>
      </div>
    `).join('')}
  `;
}

function generatePerformanceTable(performance: any): string {
  const ops = Object.entries(performance)
    .sort(([, a]: any, [, b]: any) => b.avg - a.avg)
    .slice(0, 10);

  if (ops.length === 0) {
    return '<p>No hay datos de performance</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Operación</th>
          <th>Avg (ms)</th>
          <th>P95 (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${ops.map(([name, data]: any) => `
          <tr>
            <td>${name}</td>
            <td>${data.avg}</td>
            <td>${data.p95}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateErrorsTable(errors: any): string {
  const errorList = Object.entries(errors)
    .sort(([, a]: any, [, b]: any) => b.count - a.count);

  if (errorList.length === 0) {
    return '<p style="color: #27ae60;">✓ No se encontraron errores</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Error</th>
          <th>Ocurrencias</th>
          <th>Última vez</th>
        </tr>
      </thead>
      <tbody>
        ${errorList.map(([name, data]: any) => `
          <tr>
            <td>${name}</td>
            <td><span class="badge error">${data.count}</span></td>
            <td>${new Date(data.lastSeen).toLocaleString('es-ES')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

generateDashboard().catch(console.error);
