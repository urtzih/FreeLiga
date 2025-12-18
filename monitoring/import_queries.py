#!/usr/bin/env python3
"""
Script para importar consultas guardadas en Grafana
Ejecutar: python import_queries.py
"""

import requests
import json

GRAFANA_URL = "http://localhost:3000"
GRAFANA_USER = "admin"
GRAFANA_PASSWORD = "freesquash2025"

# Consultas básicas para guardar
QUERIES = [
    {
        "name": "Todos los logs",
        "description": "Ver todos los logs de la aplicación",
        "query": '{job="freesquash-api"}',
        "datasource": "Loki"
    },
    {
        "name": "Solo errores",
        "description": "Filtrar solo logs de nivel ERROR (50)",
        "query": '{job="freesquash-api"} | json | level="50"',
        "datasource": "Loki"
    },
    {
        "name": "Eventos de negocio",
        "description": "Ver eventos de negocio (partidos, usuarios, cierres)",
        "query": '{job="freesquash-api"} | json | type="business_event"',
        "datasource": "Loki"
    },
    {
        "name": "Requests HTTP",
        "description": "Ver todas las peticiones HTTP con detalles",
        "query": '{job="freesquash-api"} | json | type="http_request"',
        "datasource": "Loki"
    },
    {
        "name": "Errores y warnings",
        "description": "Errores (50) y warnings (40)",
        "query": '{job="freesquash-api"} | json | level=~"40|50"',
        "datasource": "Loki"
    },
    {
        "name": "Requests lentos",
        "description": "Requests HTTP con tiempo de respuesta > 1000ms",
        "query": '{job="freesquash-api"} | json | type="http_request" | responseTime > 1000',
        "datasource": "Loki"
    },
    {
        "name": "Partidos creados",
        "description": "Eventos de creación de partidos",
        "query": '{job="freesquash-api"} | json | event="match_created"',
        "datasource": "Loki"
    },
    {
        "name": "Usuarios registrados",
        "description": "Eventos de registro de usuarios",
        "query": '{job="freesquash-api"} | json | event="user_registered"',
        "datasource": "Loki"
    },
    {
        "name": "Autenticación",
        "description": "Eventos relacionados con login/logout",
        "query": '{job="freesquash-api"} | json | action=~"login|logout"',
        "datasource": "Loki"
    },
    {
        "name": "Tasa de errores",
        "description": "Porcentaje de errores sobre total de logs",
        "query": 'sum(rate({job="freesquash-api"} | json | level="50" [5m])) / sum(rate({job="freesquash-api"} [5m]))',
        "datasource": "Loki"
    }
]

def main():
    """Importar consultas a Grafana"""
    session = requests.Session()
    session.auth = (GRAFANA_USER, GRAFANA_PASSWORD)
    
    print("🔄 Conectando con Grafana...")
    
    # Verificar conexión
    try:
        response = session.get(f"{GRAFANA_URL}/api/health")
        response.raise_for_status()
        print("✅ Conectado a Grafana correctamente\n")
    except Exception as e:
        print(f"❌ Error conectando a Grafana: {e}")
        return
    
    print(f"📝 Importando {len(QUERIES)} consultas guardadas...\n")
    
    # Nota: Grafana no tiene API directa para guardar queries en Explore
    # Las queries se guardan en el browser localStorage
    # Aquí generamos un archivo JSON que el usuario puede importar manualmente
    
    export_data = {
        "queries": QUERIES,
        "instructions": {
            "es": "Para usar estas consultas: 1) Ve a Explore en Grafana, 2) Selecciona datasource Loki, 3) Pega la query, 4) Haz clic en la estrella para guardar",
            "en": "To use these queries: 1) Go to Explore in Grafana, 2) Select Loki datasource, 3) Paste the query, 4) Click the star to save"
        }
    }
    
    output_file = "grafana_queries_export.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Consultas exportadas a: {output_file}\n")
    print("📋 Lista de consultas guardadas:")
    print("-" * 60)
    
    for i, query in enumerate(QUERIES, 1):
        print(f"\n{i}. {query['name']}")
        print(f"   📝 {query['description']}")
        print(f"   🔍 {query['query']}")
    
    print("\n" + "=" * 60)
    print("\n💡 Para usar estas consultas en Grafana Explore:")
    print("   1. Abre: http://localhost:3000/explore")
    print("   2. Selecciona datasource: Loki")
    print("   3. Copia y pega cualquier consulta de arriba")
    print("   4. Haz clic en 'Run query'")
    print("   5. Para guardar: haz clic en el icono de estrella ⭐")
    print("\n📖 Consulta la documentación completa en:")
    print("   docs/GRAFANA_CONSULTAS_BASICAS.md")
    print()

if __name__ == "__main__":
    main()
