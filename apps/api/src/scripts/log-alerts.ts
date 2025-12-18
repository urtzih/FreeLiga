/**
 * Sistema de Alertas para Logs
 * Ejemplo de cómo monitorear logs y enviar alertas
 * 
 * Uso: tsx src/scripts/log-alerts.ts
 */

import { LogAnalyzer } from './analyze-logs';
import { logger } from '../utils/logger';

interface AlertConfig {
  errorThreshold: number;      // Máximo de errores permitidos
  responseTimeThreshold: number; // Tiempo de respuesta máximo (ms)
  checkInterval: number;        // Intervalo de chequeo (ms)
}

const config: AlertConfig = {
  errorThreshold: 10,
  responseTimeThreshold: 1000,
  checkInterval: 60000, // 1 minuto
};

class LogAlertMonitor {
  private analyzer: LogAnalyzer;

  constructor() {
    this.analyzer = new LogAnalyzer();
  }

  /**
   * Inicia el monitoreo continuo
   */
  async start() {
    logger.info('🔔 Log Alert Monitor iniciado');
    
    setInterval(async () => {
      await this.checkForAlerts();
    }, config.checkInterval);

    // Primera ejecución inmediata
    await this.checkForAlerts();
  }

  /**
   * Verifica condiciones de alerta
   */
  private async checkForAlerts() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // 1. Revisar errores recientes
      const recentErrors = await this.analyzer.query({
        level: 'error',
        startDate: oneHourAgo.toISOString(),
        limit: 1000,
      });

      if (recentErrors.length >= config.errorThreshold) {
        await this.sendAlert('high_error_rate', {
          errorCount: recentErrors.length,
          threshold: config.errorThreshold,
          period: '1 hour',
        });
      }

      // 2. Revisar performance
      const perfMetrics = await this.analyzer.performanceMetrics({
        startDate: oneHourAgo.toISOString(),
      });

      for (const [operation, metrics] of Object.entries(perfMetrics)) {
        if ((metrics as any).p95 > config.responseTimeThreshold) {
          await this.sendAlert('slow_operation', {
            operation,
            p95: (metrics as any).p95,
            threshold: config.responseTimeThreshold,
          });
        }
      }

      // 3. Revisar errores fatales
      const fatalErrors = await this.analyzer.query({
        level: 'fatal',
        startDate: oneHourAgo.toISOString(),
        limit: 100,
      });

      if (fatalErrors.length > 0) {
        await this.sendAlert('fatal_errors', {
          count: fatalErrors.length,
          errors: fatalErrors.slice(0, 3),
        });
      }

      logger.info({ 
        errors: recentErrors.length,
        operations: Object.keys(perfMetrics).length 
      }, 'Alert check completed');

    } catch (error) {
      logger.error({ error }, 'Error during alert check');
    }
  }

  /**
   * Envía una alerta
   * En producción, integrar con servicios como:
   * - Email (SendGrid, Mailgun)
   * - Slack
   * - Discord
   * - Telegram
   * - PagerDuty
   * - Sentry
   */
  private async sendAlert(type: string, data: any) {
    logger.warn({ 
      alertType: type,
      alertData: data 
    }, `⚠️  ALERTA: ${type}`);

    // Ejemplo de integración con Slack (descomentar y configurar)
    /*
    await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Alerta: ${type}`,
        attachments: [{
          color: 'danger',
          fields: Object.entries(data).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          }))
        }]
      })
    });
    */

    // Ejemplo de integración con email
    /*
    import nodemailer from 'nodemailer';
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: 'alerts@freesquash.com',
      to: 'admin@freesquash.com',
      subject: `🚨 Alerta FreeSquash: ${type}`,
      html: `
        <h2>Alerta del Sistema</h2>
        <p><strong>Tipo:</strong> ${type}</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `
    });
    */

    // Ejemplo de integración con Discord
    /*
    await fetch('https://discord.com/api/webhooks/YOUR/WEBHOOK', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **Alerta FreeSquash**`,
        embeds: [{
          title: type,
          description: JSON.stringify(data, null, 2),
          color: 0xff0000,
          timestamp: new Date().toISOString()
        }]
      })
    });
    */
  }
}

// Ejemplo de uso
if (require.main === module) {
  const monitor = new LogAlertMonitor();
  
  monitor.start().catch(error => {
    console.error('Error starting alert monitor:', error);
    process.exit(1);
  });

  // Manejar shutdown gracefully
  process.on('SIGTERM', () => {
    logger.info('Alert monitor shutting down');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Alert monitor shutting down');
    process.exit(0);
  });
}

export { LogAlertMonitor };
