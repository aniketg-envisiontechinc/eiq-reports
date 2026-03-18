# eiq-reports Deployment Guide

**Server:** `172.232.107.79` (Ubuntu 24.04.3 LTS)
**K8s Namespace:** `eiq-apps`
**Apps:** `eiq-reports-fe` (Next.js, port 3004) · `eiq-reports-be` (NestJS, port 3005)

---

## Project Structure

```
eiq-reports/
├── eiq-reports-fe/          # Next.js frontend
│   ├── Dockerfile
│   ├── .env
│   ├── .gitignore
│   └── k8s/
│       ├── deployment.yaml
│       └── service.yaml
├── eiq-reports-be/          # NestJS backend
│   ├── Dockerfile
│   ├── .env
│   ├── .gitignore
│   └── k8s/
│       ├── deployment.yaml
│       └── service.yaml
└── DEPLOYMENT.md
```

---

## Environment Variables

### Frontend (`eiq-reports-fe/.env`)

| Variable | Value | Notes |
|---|---|---|
| `REPORTS_API_URL` | `http://eiq-reports-be-service:3005` | K8s internal service DNS |
| `NEXT_PUBLIC_S3_BASE_URL` | `https://s3-dev.engageiqglobal.com` | MinIO host (no trailing slash) |
| `NEXT_PUBLIC_S3_BUCKET_NAME` | `engageiqdevassets` | MinIO bucket name |
| `NEXT_PUBLIC_REPORT_VIEWER_URL` | `http://report-dev.engageiqglobal.com/` | Public report viewer URL |

> **Important:** `NEXT_PUBLIC_*` variables are baked into the JS bundle at **build time**.
> They must be passed as `--build-arg` during `docker build`, not just set at runtime.

### Backend (`eiq-reports-be/.env`)

| Variable | Value | Notes |
|---|---|---|
| `PORT` | `3005` | Server listen port |
| `REPORT_URL` | *(empty)* | MinIO JSON URL. If empty, uses local `data/*.json` files |
| `CORS_ORIGIN` | `http://report-dev.engageiqglobal.com` | Allowed frontend origin. Comma-separated for multiple |

---

## First-Time Deployment

### Step 1 — SSH into server

```bash
ssh kedarnathj@172.232.107.79
```

---

### Step 2 — Clone the repository

```bash
cd ~/engageiq
git clone <your-repo-url> eiq-reports
cd eiq-reports
```

> Repo contains both `eiq-reports-fe/` and `eiq-reports-be/` as subdirectories.

---

### Step 3 — Build Docker image — Backend

```bash
cd ~/engageiq/eiq-reports/eiq-reports-be
docker build -t eiq-reports-be:latest .
```

---

### Step 4 — Build Docker image — Frontend

> Must pass `NEXT_PUBLIC_*` as build args (they are baked into the bundle at build time).

```bash
cd ~/engageiq/eiq-reports/eiq-reports-fe
docker build --build-arg NEXT_PUBLIC_S3_BASE_URL=https://s3-dev.engageiqglobal.com --build-arg NEXT_PUBLIC_S3_BUCKET_NAME=engageiqdevassets --build-arg NEXT_PUBLIC_REPORT_VIEWER_URL=http://report-dev.engageiqglobal.com/ -t eiq-reports-fe:latest .
```

---

### Step 5 — Import images into containerd (required for Kubernetes)

Kubernetes uses containerd, not Docker. Images must be imported separately.

```bash
docker save eiq-reports-be:latest | sudo ctr -n k8s.io images import -
docker save eiq-reports-fe:latest | sudo ctr -n k8s.io images import -
```

Verify:
```bash
sudo ctr -n k8s.io images list | grep eiq-reports
```

---

### Step 6 — Copy K8s manifests to home directory

```bash
cp ~/engageiq/eiq-reports/eiq-reports-be/k8s/deployment.yaml ~/eiq-reports-be.yaml
cp ~/engageiq/eiq-reports/eiq-reports-be/k8s/service.yaml    ~/eiq-reports-be-service.yaml
cp ~/engageiq/eiq-reports/eiq-reports-fe/k8s/deployment.yaml ~/eiq-reports-fe.yaml
cp ~/engageiq/eiq-reports/eiq-reports-fe/k8s/service.yaml    ~/eiq-reports-fe-service.yaml
```

---

### Step 7 — Apply Kubernetes manifests

```bash
kubectl apply -f ~/eiq-reports-be.yaml
kubectl apply -f ~/eiq-reports-be-service.yaml
kubectl apply -f ~/eiq-reports-fe.yaml
kubectl apply -f ~/eiq-reports-fe-service.yaml
```

---

### Step 8 — Verify pods are running

```bash
kubectl get pods -n eiq-apps
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS   AGE
eiq-reports-be-xxxx               1/1     Running   0          1m
eiq-reports-fe-xxxx               1/1     Running   0          1m
```

If pods are not running, check logs:
```bash
kubectl logs -n eiq-apps deployment/eiq-reports-be
kubectl logs -n eiq-apps deployment/eiq-reports-fe
```

---

### Step 9 — Add Ingress rule

Open `~/eiq-ingress.yaml` and add the following rule under `spec.rules`:

```yaml
- host: report-dev.engageiqglobal.com
  http:
    paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: eiq-reports-fe-service
            port:
              number: 80
```

Apply:
```bash
kubectl apply -f ~/eiq-ingress.yaml
```

---

### Step 10 — Verify services and ingress

```bash
kubectl get svc -n eiq-apps
kubectl get ingress -n eiq-apps
```

---

## Redeployment (After Code Changes)

### Backend changed

```bash
cd ~/engageiq/eiq-reports
git pull

cd eiq-reports-be
docker build -t eiq-reports-be:latest .
docker save eiq-reports-be:latest | sudo ctr -n k8s.io images import -

kubectl rollout restart deployment/eiq-reports-be -n eiq-apps
kubectl rollout status deployment/eiq-reports-be -n eiq-apps
```

### Frontend changed

```bash
cd ~/engageiq/eiq-reports
git pull

cd eiq-reports-fe
docker build --build-arg NEXT_PUBLIC_S3_BASE_URL=https://s3-dev.engageiqglobal.com --build-arg NEXT_PUBLIC_S3_BUCKET_NAME=engageiqdevassets --build-arg NEXT_PUBLIC_REPORT_VIEWER_URL=http://report-dev.engageiqglobal.com/ -t eiq-reports-fe:latest .
docker save eiq-reports-fe:latest | sudo ctr -n k8s.io images import -

kubectl rollout restart deployment/eiq-reports-fe -n eiq-apps
kubectl rollout status deployment/eiq-reports-fe -n eiq-apps
```

---

## Useful kubectl Commands

```bash
# List all pods
kubectl get pods -n eiq-apps

# List all services
kubectl get svc -n eiq-apps

# View pod logs
kubectl logs -n eiq-apps deployment/eiq-reports-be
kubectl logs -n eiq-apps deployment/eiq-reports-fe

# Describe pod (for error details)
kubectl describe pod -n eiq-apps <pod-name>

# Restart a deployment
kubectl rollout restart deployment/eiq-reports-be -n eiq-apps
kubectl rollout restart deployment/eiq-reports-fe -n eiq-apps

# Delete and re-apply a deployment
kubectl delete -f ~/eiq-reports-be.yaml && kubectl apply -f ~/eiq-reports-be.yaml
```

---

## Ports Reference

| Service | Internal Port | K8s Service Port | Access |
|---|---|---|---|
| `eiq-reports-fe` | 3004 | 80 | Via Ingress → `report-dev.engageiqglobal.com` |
| `eiq-reports-be` | 3005 | 3005 | Internal only (`eiq-reports-be-service:3005`) |
