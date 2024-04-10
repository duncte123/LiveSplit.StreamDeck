import { Socket } from 'node:net';
import { EventEmitter } from 'node:events';
import streamdeck from '@elgato/streamdeck';

export interface LiveSplit {
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'data', listener: (data: string) => void): this;
}

/**
 * This is https://github.com/satanch/node-livesplit-client but rewritten for TypeScript.
 */
export class LiveSplit extends EventEmitter {
    private socket: Socket | null = null;
    private connected = false;
    private logger = streamdeck.logger;

    async connect(ip: string, port: number): Promise<void> {
        this.socket = new Socket();

        return new Promise((resolve, reject) => {
            this.socket!.on('data', (data) => {
                const stringData = data.toString('utf-8').replace('\r\n', '');

                this.emit('data', stringData);
                this.logger.trace(`Data from LiveSplit: ${stringData}`);
            });

            this.socket!.on('error', (err) => {
                this.logger.error('Connection to livesplit failed', err);
                // this.emit('error', err); // TODO: somehow this causes an uncaught exception?????
                reject(err);
            });

            this.socket!.on('close', () => {
                this.connected = false;
                this.emit('disconnected');
            });

            this.logger.info(`Connecting to ${ip}:${port}...`);
            this.socket!.connect(port, ip, () => {
                this.connected = true;
                this.emit('connected');
                this.logger.info('LiveSplit connected!');
                resolve();
            });
        })
    }

    disconnect(): boolean {
        if (!this.connected || this.socket == null) {
            return false;
        }

        this.socket!.destroy();
        this.socket = null;
        this.connected = false;
        this.emit('disconnected');

        return true;
    }

    get isConnected(): boolean {
        return this.connected;
    }

    private async send(data: string): Promise<void> {
        this.socket!.write(`${data}\r\n`);
    }

    async startOrSplit(): Promise<void> {
        return this.send('startorsplit');
    }
}

export const instance = new LiveSplit();