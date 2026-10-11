import os from 'os';
import { config } from '../config';
import { dbManager } from '../config/database';

export interface SystemHealth {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsageMB: number;
    freeMemoryMB: number;
  };
}

export interface DatabaseReadiness {
  status: 'ready' | 'not_ready' | 'simulated_phase0';
  database: 'mongodb';
  connected: boolean;
  message: string;
  timestamp: string;
}

export class HealthService {
  getSystemHealth(): SystemHealth {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.NODE_ENV,
      system: {
        nodeVersion: process.version,
        platform: os.platform(),
        memoryUsageMB: Math.round(memory.heapUsed / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      },
    };
  }

  getDatabaseReadiness(): DatabaseReadiness {
    const dbStatus = dbManager.getStatus();
    return {
      status: dbStatus.connected ? 'ready' : 'not_ready',
      database: 'mongodb',
      connected: dbStatus.connected,
      message: dbStatus.connected
        ? `MongoDB connected (${dbStatus.isReplicaSet ? 'Replica Set' : 'Standalone'})`
        : 'MongoDB is disconnected or unreachable',
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
