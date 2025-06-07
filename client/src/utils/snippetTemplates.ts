import { Snippet } from '../types/snippets';

export interface SnippetTemplate {
  id: string;
  name: string;
  description: string;
  category: string[];
  icon: string;
  template: Omit<Snippet, 'id' | 'updated_at'>;
}

export const snippetTemplates: SnippetTemplate[] = [
  // Kubernetes Templates (Priority for DevOps work)
  {
    id: 'k8s-deployment-service',
    name: 'Kubernetes Deployment + Service',
    description: 'Complete Kubernetes app deployment with service',
    category: ['kubernetes', 'k8s', 'deployment', 'devops'],
    icon: '☸️',
    template: {
      title: 'New Kubernetes App Deployment',
      description: 'Complete Kubernetes deployment with service and best practices',
      categories: ['kubernetes', 'deployment', 'service', 'devops'],
      is_public: 0,
      fragments: [
        {
          file_name: 'deployment.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
  labels:
    app: my-app
    version: v1.0.0
    environment: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v1.0.0
    spec:
      containers:
      - name: app
        image: nginx:1.21-alpine
        ports:
        - containerPort: 80
          name: http
        env:
        - name: ENV
          value: "production"
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
      securityContext:
        fsGroup: 2000`
        },
        {
          file_name: 'service.yaml',
          language: 'yaml',
          position: 1,
          code: `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  namespace: default
  labels:
    app: my-app
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: my-app`
        }
      ]
    }
  },
  {
    id: 'k8s-configmap-secret',
    name: 'Kubernetes ConfigMap + Secret',
    description: 'Configuration and secrets management',
    category: ['kubernetes', 'k8s', 'config', 'devops'],
    icon: '🔐',
    template: {
      title: 'New Kubernetes Configuration',
      description: 'ConfigMap and Secret for application configuration',
      categories: ['kubernetes', 'configmap', 'secret', 'config'],
      is_public: 0,
      fragments: [
        {
          file_name: 'configmap.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  namespace: default
  labels:
    app: my-app
data:
  # Application configuration
  app.properties: |
    database.host=postgres-service
    database.port=5432
    database.name=myapp
    logging.level=INFO
    feature.enabled=true
  
  # Nginx configuration
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location /health {
            return 200 'healthy\\n';
            add_header Content-Type text/plain;
        }
    }
  
  # Environment-specific settings
  DATABASE_URL: "postgresql://user@postgres:5432/myapp"
  REDIS_URL: "redis://redis:6379"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"`
        },
        {
          file_name: 'secret.yaml',
          language: 'yaml',
          position: 1,
          code: `apiVersion: v1
kind: Secret
metadata:
  name: my-app-secrets
  namespace: default
  labels:
    app: my-app
type: Opaque
data:
  # Base64 encoded values (use: echo -n "password" | base64)
  database-password: cGFzc3dvcmQxMjM=  # password123
  api-key: YWJjZGVmZ2hpams=  # abcdefghijk
  jwt-secret: c3VwZXJzZWNyZXRqd3RrZXk=  # supersecretjwtkey
stringData:
  # Plain text values (automatically base64 encoded)
  database-username: "myapp_user"
  redis-password: "redis_password_here"
  oauth-client-secret: "oauth_client_secret_here"
  
  # Multi-line secrets
  tls-cert: |
    -----BEGIN CERTIFICATE-----
    # Your certificate content here
    -----END CERTIFICATE-----
  
  tls-key: |
    -----BEGIN PRIVATE KEY-----
    # Your private key content here
    -----END PRIVATE KEY-----`
        }
      ]
    }
  },
  {
    id: 'k8s-ingress',
    name: 'Kubernetes Ingress',
    description: 'HTTP/HTTPS traffic routing with SSL',
    category: ['kubernetes', 'k8s', 'ingress', 'networking'],
    icon: '🌐',
    template: {
      title: 'New Kubernetes Ingress',
      description: 'Ingress controller for external HTTP/HTTPS access',
      categories: ['kubernetes', 'ingress', 'networking', 'ssl'],
      is_public: 0,
      fragments: [
        {
          file_name: 'ingress.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: default
  labels:
    app: my-app
  annotations:
    # Nginx Ingress Controller
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # Certificate management (cert-manager)
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    cert-manager.io/acme-challenge-type: http01
    
    # Rate limiting
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    
    # CORS (if needed)
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://myapp.com"
    
    # Custom headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Frame-Options SAMEORIGIN;
      add_header X-Content-Type-Options nosniff;
      add_header X-XSS-Protection "1; mode=block";
spec:
  tls:
  - hosts:
    - myapp.example.com
    - www.myapp.example.com
    secretName: my-app-tls
  
  rules:
  # Main application
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: my-app-api-service
            port:
              number: 8080
  
  # WWW redirect or separate service
  - host: www.myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 80`
        }
      ]
    }
  },
  {
    id: 'k8s-cronjob',
    name: 'Kubernetes CronJob',
    description: 'Scheduled job execution',
    category: ['kubernetes', 'k8s', 'cronjob', 'batch'],
    icon: '⏰',
    template: {
      title: 'New Kubernetes CronJob',
      description: 'Scheduled job for automation and batch processing',
      categories: ['kubernetes', 'cronjob', 'batch', 'automation'],
      is_public: 0,
      fragments: [
        {
          file_name: 'cronjob.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-scheduled-job
  namespace: default
  labels:
    app: my-scheduled-job
spec:
  # Schedule: minute hour day-of-month month day-of-week
  # Examples:
  # "0 2 * * *"     # Daily at 2:00 AM
  # "0 */6 * * *"   # Every 6 hours
  # "30 1 * * 0"    # Weekly on Sunday at 1:30 AM
  # "0 0 1 * *"     # Monthly on the 1st at midnight
  schedule: "0 2 * * *"  # Daily at 2:00 AM
  
  # Timezone (Kubernetes 1.25+)
  timeZone: "UTC"
  
  # Job history limits
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  
  # Concurrency policy
  concurrencyPolicy: Forbid  # Forbid, Allow, or Replace
  
  # Starting deadline
  startingDeadlineSeconds: 300  # 5 minutes
  
  jobTemplate:
    metadata:
      labels:
        app: my-scheduled-job
    spec:
      # Job completion and retry settings
      completions: 1
      parallelism: 1
      backoffLimit: 3
      activeDeadlineSeconds: 3600  # 1 hour timeout
      
      template:
        metadata:
          labels:
            app: my-scheduled-job
        spec:
          restartPolicy: OnFailure
          
          containers:
          - name: job-container
            image: alpine:3.18
            command:
            - /bin/sh
            - -c
            - |
              echo "Starting scheduled job at $(date)"
              
              # Your job logic here
              echo "Processing data..."
              
              # Example: Database cleanup
              # psql $DATABASE_URL -c "DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days'"
              
              # Example: File processing
              # find /data -name "*.tmp" -mtime +7 -delete
              
              # Example: API call
              # curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{"status":"completed"}'
              
              echo "Job completed successfully at $(date)"
            
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: database-url
            - name: LOG_LEVEL
              value: "INFO"
            
            resources:
              requests:
                cpu: 100m
                memory: 128Mi
              limits:
                cpu: 500m
                memory: 512Mi
          
          # Optional: Use service account with specific permissions
          # serviceAccountName: job-service-account
          
          # Optional: Node selection
          # nodeSelector:
          #   workload-type: batch`
        }
      ]
    }
  },
  {
    id: 'k8s-pvc-storage',
    name: 'Kubernetes PVC + Storage',
    description: 'Persistent volume claim for data storage',
    category: ['kubernetes', 'k8s', 'storage', 'pvc'],
    icon: '💾',
    template: {
      title: 'New Kubernetes Storage',
      description: 'Persistent Volume Claim for application data storage',
      categories: ['kubernetes', 'storage', 'pvc', 'volumes'],
      is_public: 0,
      fragments: [
        {
          file_name: 'pvc.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-storage
  namespace: default
  labels:
    app: my-app
    storage-type: application-data
spec:
  accessModes:
    - ReadWriteOnce  # RWO, ROX, or RWX
  storageClassName: fast-ssd  # Use your cluster's storage class
  resources:
    requests:
      storage: 10Gi
  
  # Optional: Volume selector (for pre-created PVs)
  # selector:
  #   matchLabels:
  #     environment: production
  #     app: my-app

---
# Example: Storage Class (if you need to create one)
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  labels:
    storage-tier: premium
provisioner: kubernetes.io/aws-ebs  # Change based on your cloud provider
parameters:
  type: gp3
  fsType: ext4
  encrypted: "true"
reclaimPolicy: Retain  # Retain, Delete, or Recycle
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer

---
# Example: How to use the PVC in a deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-with-storage
  namespace: default
spec:
  replicas: 1  # PVC with RWO can only be used by one pod
  selector:
    matchLabels:
      app: my-app-with-storage
  template:
    metadata:
      labels:
        app: my-app-with-storage
    spec:
      containers:
      - name: app
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: myapp
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1Gi
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: my-app-storage`
        }
      ]
    }
  },
  {
    id: 'k8s-namespace-rbac',
    name: 'Kubernetes Namespace + RBAC',
    description: 'Namespace with role-based access control',
    category: ['kubernetes', 'k8s', 'namespace', 'rbac'],
    icon: '🔒',
    template: {
      title: 'New Kubernetes Namespace with RBAC',
      description: 'Namespace setup with service account and role-based access control',
      categories: ['kubernetes', 'namespace', 'rbac', 'security'],
      is_public: 0,
      fragments: [
        {
          file_name: 'namespace-rbac.yaml',
          language: 'yaml',
          position: 0,
          code: `# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: my-application
  labels:
    name: my-application
    environment: production
    team: backend
  annotations:
    description: "Production environment for my application"

---
# Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-service-account
  namespace: my-application
  labels:
    app: my-app

---
# Role (namespace-scoped permissions)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: my-application
  name: my-app-role
rules:
# Pods permissions
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]

# ConfigMaps and Secrets
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]

# Services
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "watch"]

# Deployments
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]

---
# RoleBinding (connects ServiceAccount to Role)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-app-rolebinding
  namespace: my-application
subjects:
- kind: ServiceAccount
  name: my-app-service-account
  namespace: my-application
roleRef:
  kind: Role
  name: my-app-role
  apiGroup: rbac.authorization.k8s.io

---
# Resource Quota (optional - limits resource usage)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: my-application-quota
  namespace: my-application
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
    pods: "20"
    services: "10"
    secrets: "20"
    configmaps: "20"

---
# Limit Range (optional - sets default resource limits)
apiVersion: v1
kind: LimitRange
metadata:
  name: my-application-limits
  namespace: my-application
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
  - max:
      storage: 100Gi
    type: PersistentVolumeClaim`
        }
      ]
    }
  },
  {
    id: 'k8s-hpa-monitoring',
    name: 'Kubernetes HPA + Monitoring',
    description: 'Horizontal Pod Autoscaler with monitoring',
    category: ['kubernetes', 'k8s', 'hpa', 'autoscaling'],
    icon: '📈',
    template: {
      title: 'New Kubernetes Autoscaling',
      description: 'Horizontal Pod Autoscaler with monitoring and alerting',
      categories: ['kubernetes', 'hpa', 'autoscaling', 'monitoring'],
      is_public: 0,
      fragments: [
        {
          file_name: 'hpa.yaml',
          language: 'yaml',
          position: 0,
          code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: default
  labels:
    app: my-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  
  minReplicas: 2
  maxReplicas: 10
  
  metrics:
  # CPU utilization
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  
  # Memory utilization
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  
  # Custom metrics (requires metrics server)
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5 minutes
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 60   # 1 minute
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 4
        periodSeconds: 60
      selectPolicy: Max

---
# ServiceMonitor for Prometheus (if using Prometheus Operator)
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-metrics
  namespace: default
  labels:
    app: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics

---
# Example Service with metrics endpoint
apiVersion: v1
kind: Service
metadata:
  name: my-app-metrics-service
  namespace: default
  labels:
    app: my-app
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
  selector:
    app: my-app`
        }
      ]
    }
  },
  
  // Development Templates (Secondary priority)
  {
    id: 'react-component',
    name: 'React Component',
    description: 'Functional React component with TypeScript',
    category: ['react', 'typescript', 'frontend'],
    icon: '⚛️',
    template: {
      title: 'New React Component',
      description: 'A functional React component with TypeScript',
      categories: ['react', 'typescript', 'components'],
      is_public: 0,
      fragments: [
        {
          file_name: 'Component.tsx',
          language: 'typescript',
          position: 0,
          code: `import React from 'react';

interface ComponentProps {
  // Define your props here
}

export const Component: React.FC<ComponentProps> = ({
  // destructure props here
}) => {
  return (
    <div className="">
      {/* Your component JSX here */}
    </div>
  );
};

export default Component;`
        }
      ]
    }
  },
  {
    id: 'python-script',
    name: 'Python Script',
    description: 'Python script with proper structure',
    category: ['python', 'scripting'],
    icon: '🐍',
    template: {
      title: 'New Python Script',
      description: 'A well-structured Python script',
      categories: ['python', 'scripts'],
      is_public: 0,
      fragments: [
        {
          file_name: 'script.py',
          language: 'python',
          position: 0,
          code: `#!/usr/bin/env python3
"""
Description: Your script description here
Author: Your name
Date: ${new Date().toISOString().split('T')[0]}
"""

import sys
import os
from typing import Optional, List, Dict


def main() -> None:
    """Main function"""
    print("Hello, World!")
    
    # Your main logic here
    pass


if __name__ == "__main__":
    main()`
        }
      ]
    }
  },
  {
    id: 'bash-script',
    name: 'Bash Script',
    description: 'Bash script with error handling',
    category: ['bash', 'shell', 'scripting'],
    icon: '🔧',
    template: {
      title: 'New Bash Script',
      description: 'A robust bash script with error handling',
      categories: ['bash', 'shell', 'scripts'],
      is_public: 0,
      fragments: [
        {
          file_name: 'script.sh',
          language: 'bash',
          position: 0,
          code: `#!/bin/bash

# Script: ${new Date().toISOString().split('T')[0]}
# Description: Your script description here
# Usage: ./script.sh [options]

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Functions
log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1" >&2
}

# Main script logic
main() {
    log_info "Starting script..."
    
    # Your script logic here
    
    log_info "Script completed successfully"
}

# Run main function
main "$@"`
        }
      ]
    }
  },
  {
    id: 'javascript-function',
    name: 'JavaScript Function',
    description: 'Modern JavaScript function with JSDoc',
    category: ['javascript', 'functions'],
    icon: '🟨',
    template: {
      title: 'New JavaScript Function',
      description: 'A modern JavaScript function with documentation',
      categories: ['javascript', 'functions'],
      is_public: 0,
      fragments: [
        {
          file_name: 'function.js',
          language: 'javascript',
          position: 0,
          code: `/**
 * Description of your function
 * @param {string} param1 - Description of parameter 1
 * @param {number} param2 - Description of parameter 2
 * @returns {Promise<any>} Description of return value
 */
export const myFunction = async (param1, param2) => {
  try {
    // Input validation
    if (!param1 || typeof param1 !== 'string') {
      throw new Error('param1 must be a non-empty string');
    }
    
    if (typeof param2 !== 'number') {
      throw new Error('param2 must be a number');
    }
    
    // Your function logic here
    const result = \`Processing \${param1} with value \${param2}\`;
    
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in myFunction:', error);
    throw error;
  }
};

export default myFunction;`
        }
      ]
    }
  },
  {
    id: 'sql-query',
    name: 'SQL Query',
    description: 'SQL query template with common patterns',
    category: ['sql', 'database'],
    icon: '🗄️',
    template: {
      title: 'New SQL Query',
      description: 'SQL query with common patterns and best practices',
      categories: ['sql', 'database', 'queries'],
      is_public: 0,
      fragments: [
        {
          file_name: 'query.sql',
          language: 'sql',
          position: 0,
          code: `-- Query Description: Your query description here
-- Author: Your name
-- Date: ${new Date().toISOString().split('T')[0]}

-- Main Query
SELECT 
    t1.id,
    t1.name,
    t1.created_at,
    COUNT(t2.id) as related_count
FROM 
    table_name t1
LEFT JOIN 
    related_table t2 ON t1.id = t2.table_id
WHERE 
    t1.status = 'active'
    AND t1.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    t1.id, t1.name, t1.created_at
HAVING 
    COUNT(t2.id) > 0
ORDER BY 
    t1.created_at DESC
LIMIT 100;

-- Alternative query patterns:

-- UPDATE with JOIN
-- UPDATE table_name t1
-- SET status = 'updated'
-- FROM related_table t2
-- WHERE t1.id = t2.table_id
--   AND t2.condition = 'value';

-- Common Table Expression (CTE)
-- WITH ranked_data AS (
--     SELECT 
--         *,
--         ROW_NUMBER() OVER (PARTITION BY group_column ORDER BY sort_column DESC) as rn
--     FROM table_name
--     WHERE condition = 'value'
-- )
-- SELECT * FROM ranked_data WHERE rn = 1;`
        }
      ]
    }
  },
  {
    id: 'express-route',
    name: 'Express.js Route',
    description: 'Express.js API route with middleware',
    category: ['nodejs', 'express', 'api'],
    icon: '🛣️',
    template: {
      title: 'New Express Route',
      description: 'Express.js API route with validation and error handling',
      categories: ['nodejs', 'express', 'api', 'backend'],
      is_public: 0,
      fragments: [
        {
          file_name: 'route.js',
          language: 'javascript',
          position: 0,
          code: `const express = require('express');
const router = express.Router();

// Middleware for this route
const validateRequest = (req, res, next) => {
  // Add your validation logic here
  const { body } = req;
  
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({
      error: 'Request body is required',
      code: 'MISSING_BODY'
    });
  }
  
  next();
};

/**
 * @route   GET /api/resource
 * @desc    Get all resources
 * @access  Public/Private
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Your GET logic here
    const data = {
      items: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GET /api/resource error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route   POST /api/resource
 * @desc    Create new resource
 * @access  Private
 */
router.post('/', validateRequest, async (req, res) => {
  try {
    const { body } = req;
    
    // Your POST logic here
    const newResource = {
      id: Date.now(), // Replace with proper ID generation
      ...body,
      created_at: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: newResource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    console.error('POST /api/resource error:', error);
    res.status(500).json({
      error: 'Failed to create resource',
      code: 'CREATE_FAILED'
    });
  }
});

module.exports = router;`
        }
      ]
    }
  },
  {
    id: 'css-component',
    name: 'CSS Component',
    description: 'Modern CSS component with variables',
    category: ['css', 'styling', 'frontend'],
    icon: '🎨',
    template: {
      title: 'New CSS Component',
      description: 'Modern CSS component with custom properties and responsive design',
      categories: ['css', 'styling', 'components'],
      is_public: 0,
      fragments: [
        {
          file_name: 'component.css',
          language: 'css',
          position: 0,
          code: `/* Component Name: Your Component Name
 * Description: Component description here
 * Author: Your name
 * Date: ${new Date().toISOString().split('T')[0]}
 */

.component {
  /* CSS Custom Properties (Variables) */
  --component-primary-color: #3b82f6;
  --component-secondary-color: #64748b;
  --component-background: #ffffff;
  --component-border-radius: 0.5rem;
  --component-padding: 1rem;
  --component-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --component-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Base Styles */
  display: flex;
  flex-direction: column;
  background-color: var(--component-background);
  border-radius: var(--component-border-radius);
  padding: var(--component-padding);
  box-shadow: var(--component-shadow);
  transition: var(--component-transition);
  
  /* Optional: Container queries for responsive design */
  container-type: inline-size;
}

/* Component States */
.component:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.component:focus-within {
  outline: 2px solid var(--component-primary-color);
  outline-offset: 2px;
}

.component--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Component Variants */
.component--small {
  --component-padding: 0.5rem;
  font-size: 0.875rem;
}

.component--large {
  --component-padding: 1.5rem;
  font-size: 1.125rem;
}

/* Child Elements */
.component__header {
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--component-primary-color);
}

.component__content {
  flex: 1;
  color: var(--component-secondary-color);
  line-height: 1.6;
}

.component__footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

/* Responsive Design */
@container (min-width: 400px) {
  .component {
    flex-direction: row;
    align-items: center;
  }
  
  .component__header {
    margin-bottom: 0;
    margin-right: 1rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .component {
    --component-background: #1f2937;
    --component-secondary-color: #9ca3af;
    --component-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }
  
  .component__footer {
    border-top-color: #374151;
  }
}

/* Print Styles */
@media print {
  .component {
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}`
        }
      ]
    }
  },
  {
    id: 'typescript-interface',
    name: 'TypeScript Interface',
    description: 'TypeScript interface with documentation',
    category: ['typescript', 'types', 'interfaces'],
    icon: '🔷',
    template: {
      title: 'New TypeScript Interface',
      description: 'Well-documented TypeScript interface with examples',
      categories: ['typescript', 'types', 'interfaces'],
      is_public: 0,
      fragments: [
        {
          file_name: 'interfaces.ts',
          language: 'typescript',
          position: 0,
          code: `/**
 * Interface Description: Describe your interface purpose here
 * @example
 * const example: MyInterface = {
 *   id: '123',
 *   name: 'Example',
 *   status: 'active',
 *   metadata: { version: 1 }
 * };
 */
export interface MyInterface {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Current status of the item */
  status: 'active' | 'inactive' | 'pending';
  
  /** Optional description */
  description?: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Additional metadata */
  metadata: {
    version: number;
    tags?: string[];
    [key: string]: any;
  };
  
  /** Configuration options */
  config: {
    enabled: boolean;
    settings: Record<string, unknown>;
  };
}

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Generic repository interface
 */
export interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
}

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  include?: string[];
}

/**
 * Utility types
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;

// Example usage and type guards
export const isMyInterface = (obj: any): obj is MyInterface => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    ['active', 'inactive', 'pending'].includes(obj.status) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    obj.metadata &&
    typeof obj.metadata.version === 'number'
  );
};`
        }
      ]
    }
  }
];

// Utility function to get templates by category
export const getTemplatesByCategory = (category: string): SnippetTemplate[] => {
  return snippetTemplates.filter(template => 
    template.category.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
  );
};

// Utility function to search templates
export const searchTemplates = (query: string): SnippetTemplate[] => {
  const searchTerm = query.toLowerCase();
  return snippetTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.category.some(cat => cat.toLowerCase().includes(searchTerm))
  );
};

// Get template by ID
export const getTemplateById = (id: string): SnippetTemplate | undefined => {
  return snippetTemplates.find(template => template.id === id);
}; 