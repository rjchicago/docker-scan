#!/bin/bash
set -Eeuo pipefail

DTR_URL=dtr.cnvr.net
export VERSION=latest

echo "DTR User:" 
read DTR_USER
echo "DTR Password for $DTR_USER:" 
read -s DTR_PASSWORD

docker-compose -f docker-stack.yml build service

export DOCKER_CONFIG="$(pwd)/.docker"
echo "$DTR_PASSWORD" | docker login -u $DTR_USER --password-stdin $DTR_URL
docker-compose -f docker-stack.yml push service
docker logout $DTR_URL
