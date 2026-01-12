# Deployment Guide for VPS

This guide will help you deploy the Streams application on your VPS using Docker.

## Prerequisites

1. **VPS with Docker installed**
   - Ubuntu 20.04 or later recommended
   - Docker and Docker Compose installed
   - At least 2GB RAM, 2 CPU cores

2. **External Services** (provision these separately):
   - PostgreSQL database
   - Redis instance
   - RabbitMQ server (optional, only if using message queue features)

3. **Network Configuration**:
   - Public IP address of your VPS
   - Firewall rules configured (see below)

## Firewall Configuration

Open the following ports on your VPS:

```bash
# HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# API Server
sudo ufw allow 8000/tcp

# Frontend
sudo ufw allow 3000/tcp

# WebRTC Server (signaling)
sudo ufw allow 4000/tcp

# WebRTC Media Ports (UDP is critical for media streaming)
sudo ufw allow 10000:10100/udp
sudo ufw allow 10000:10100/tcp

# Enable firewall
sudo ufw enable
```

## Setup Instructions

### 1. Clone the Repository

```bash
cd /opt
git clone <your-repo-url> streams
cd streams
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual configuration:

```bash
nano .env
```

**Critical Settings:**

- `PUBLIC_IP`: Your VPS public IP address (REQUIRED for WebRTC)
- `DATABASE_URL`: Your PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Your Redis configuration
- `SESSION_SECRET`: Generate a strong random string
- OAuth credentials for Google/GitHub authentication

### 3. WebRTC Server Configuration

The WebRTC server uses **host networking mode** to properly announce its IP to clients. This is necessary because:

- WebRTC requires direct peer-to-peer connections
- The server must advertise the correct public IP to clients
- UDP ports must be accessible for media streaming

The `WEBRTC_LISTEN_IP` environment variable is set to your `PUBLIC_IP`, which tells mediasoup to announce this IP to connecting clients.

### 4. Build and Start Services

Build the Docker images:

```bash
docker-compose build
```

Start all services:

```bash
docker-compose up -d
```

Check the status:

```bash
docker-compose ps
```

View logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f webrtc-server
docker-compose logs -f server
docker-compose logs -f frontend
docker-compose logs -f workers
```

### 5. Database Migration

Run database migrations (if using Drizzle):

```bash
docker-compose exec server npm run migrate
```

### 6. Verify Deployment

Check each service:

1. **API Server**: `curl http://localhost:8000/api/`
2. **Frontend**: Visit `http://your-vps-ip:3000`
3. **WebRTC Server**: Should be accessible on port 4000

## Network Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VPS Server                        │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Frontend   │  │  API Server  │                │
│  │   :3000      │  │    :8000     │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Workers    │  │WebRTC Server │                │
│  │  (internal)  │  │  (host mode) │                │
│  └──────────────┘  └──────────────┘                │
│                          │                           │
│                    UDP Ports                         │
│                   10000-10100                        │
└──────────────────────┼──────────────────────────────┘
                       │
                   Public IP
                       │
                  ┌────┴────┐
                  │ Clients │
                  └─────────┘
```

## WebRTC Host Networking Explained

The WebRTC server uses `network_mode: "host"` which means:

1. **Container shares host's network stack** - No port mapping needed
2. **Direct access to host's IP** - Can bind to and announce the public IP
3. **No NAT traversal issues** - Clients connect directly to the advertised IP
4. **UDP performance** - Critical for real-time media streaming

When a client connects:
1. Client connects to WebRTC server on port 4000 (signaling)
2. Server creates transport and announces `PUBLIC_IP` with ports 10000-10100
3. Client establishes direct UDP connection to `PUBLIC_IP:10000-10100`
4. Media streams flow directly through these UDP connections

## Reverse Proxy (Optional but Recommended)

For production, use Nginx or Caddy as a reverse proxy:

### Nginx Example

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Server
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# WebRTC Server (signaling only - media goes direct)
server {
    listen 80;
    server_name webrtc.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Note**: Media streams (UDP ports 10000-10100) bypass the reverse proxy and connect directly to the VPS public IP.

## Maintenance Commands

### Update Application

```bash
cd /opt/streams
git pull
docker-compose build
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f webrtc-server
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart webrtc-server
```

### Stop Services

```bash
docker-compose down
```

### Remove Everything (including volumes)

```bash
docker-compose down -v
```

## Troubleshooting

### WebRTC Connection Issues

1. **Check Public IP Configuration**:
   ```bash
   echo $PUBLIC_IP
   # Should match your VPS public IP
   ```

2. **Verify UDP Ports are Open**:
   ```bash
   sudo ufw status
   # Should show 10000:10100/udp ALLOW
   ```

3. **Check WebRTC Server Logs**:
   ```bash
   docker-compose logs webrtc-server | grep -i "announced"
   # Should see your public IP being announced
   ```

4. **Test from Client**:
   - Open browser developer console
   - Check for WebRTC connection errors
   - Verify ICE candidates include your public IP

### Container Issues

```bash
# Check container status
docker-compose ps

# Inspect specific container
docker inspect streams-webrtc

# Check resource usage
docker stats

# Restart problematic container
docker-compose restart <service-name>
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec server node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT NOW()')"
```

### Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec server node -e "require('ioredis').default({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD}).ping()"
```

## Performance Tuning

### For High Traffic

1. **Increase WebRTC Port Range**:
   ```env
   MEDIASOUP_MIN_PORT=10000
   MEDIASOUP_MAX_PORT=20000
   ```

2. **Optimize Worker Processes**:
   Edit docker-compose.yml to add resource limits:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

3. **Enable Redis Persistence** (if using managed Redis)

4. **Use CDN** for frontend static assets

## Security Recommendations

1. **Use SSL/TLS** - Deploy with Let's Encrypt
2. **Secure Environment Variables** - Never commit `.env` to git
3. **Regular Updates** - Keep Docker images and dependencies updated
4. **Firewall Rules** - Only open necessary ports
5. **Rate Limiting** - Uncomment rate limiter in server code
6. **Database Backups** - Regular automated backups

## Monitoring

Consider setting up monitoring for:

- Container health: `docker-compose ps`
- Logs aggregation: ELK stack or similar
- Resource usage: Prometheus + Grafana
- Uptime monitoring: UptimeRobot or similar

## Support

For issues, check:
1. Container logs: `docker-compose logs`
2. Application logs in `/var/log/streams/` (if configured)
3. System resources: `htop`, `df -h`
4. Network connectivity: `netstat -tulpn`
