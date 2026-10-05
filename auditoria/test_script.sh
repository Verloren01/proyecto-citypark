#!/bin/bash

echo "====================================================="
echo " AUDITORÍA AUTOMATIZADA DEVSECOPS - CASO 8 CITYPARK"
echo "====================================================="

echo -e "\n[+] PRUEBA 1: A05 Configuración Insegura (Lectura de .env)"
echo "-> Atacando API Vulnerable (Puerto 3000):"
curl -s http://localhost:3000/.env | head -n 2
echo -e "\n-> Atacando API Segura (Puerto 3001):"
curl -s -o /dev/null -w "Código HTTP: %{http_code}\n" http://localhost:3001/.env

echo -e "\n-----------------------------------------------------"
echo "[+] PRUEBA 2: A04 Diseño Inseguro (Ingreso de Multa Negativa)"
echo "-> Atacando API Vulnerable (Puerto 3000):"
curl -s -X POST http://localhost:3000/api/multas -H "Content-Type: application/json" -d '{"plate":"ABCD12", "amount":-50000, "comment":"fraude"}'
echo -e "\n-> Atacando API Segura (Puerto 3001):"
curl -s -X POST http://localhost:3001/api/multas -H "Content-Type: application/json" -d '{"plate":"ABCD12", "amount":-50000, "comment":"fraude"}'

echo -e "\n-----------------------------------------------------"
echo "[+] PRUEBA 3: A01 Control de Acceso Roto (Anular sin token)"
echo "-> Atacando API Vulnerable (Puerto 3000):"
curl -s -X PUT http://localhost:3000/api/multas/anular/1
echo -e "\n-> Atacando API Segura (Puerto 3001):"
curl -s -X PUT http://localhost:3001/api/multas/anular/1

echo -e "\n\n====================================================="
echo " FIN DE LA PRUEBA AUTOMATIZADA"
echo "====================================================="