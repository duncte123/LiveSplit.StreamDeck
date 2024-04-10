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
    private waitTimeout = 100;
    /**
     * True if we are processing a command that needs a response.
     * @private
     */
    private processingCommands = false;
    private commands: { resolve: Function, command: string }[] = [];
    private commandsWithoutResponse: string[] = [];
    private logger = streamdeck.logger;
    private connecting = false;

    async connect(ip: string, port: number): Promise<void> {
        if (this.connecting) {
            return;
        }

        if (this.connected) {
            throw new Error('Already connected to LiveSplit!');
        }

        this.connecting = true;

        this.socket = new Socket();

        return new Promise((resolve, reject) => {
            this.socket!.on('data', (data) => {
                const stringData = data.toString('utf-8').replace('\r\n', '');

                this.emit('data', stringData);
                this.logger.trace(`Data from LiveSplit: ${stringData}`);
            });

            this.socket!.on('error', (err) => {
                this.connecting = false;
                this.logger.error('Connection to livesplit failed', err);
                // this.emit('error', err); // TODO: somehow this causes an uncaught exception?????
                reject(err);
            });

            this.socket!.on('close', () => {
                this.connected = false;
                this.connecting = false;
                this.emit('disconnected');
            });

            this.logger.info(`Connecting to ${ip}:${port}...`);
            this.socket!.connect(port, ip, () => {
                this.connecting = false;
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

    private sendNext() {
        if (this.commands.length === 0) {
            this.processingCommands = false;

            while (this.commandsWithoutResponse.length) {
                this.socket!.write(this.commandsWithoutResponse.pop() as string);
            }

            return;
        }

        this.processingCommands = true;

        const nextCommand = this.commands[0];

        const timeout = setTimeout(() => {
            this.commands.shift();
            this.removeListener('data', listener);
            nextCommand.resolve(null);
            this.sendNext();
        }, this.waitTimeout);

        const listener = (data: string) => {
            this.commands.shift();
            clearTimeout(timeout);
            nextCommand.resolve(data);
            this.sendNext();
        };

        this.once('data', listener);
        this.socket!.write(nextCommand.command);
    }

    private async send(data: string, expectResponse: boolean = false): Promise<boolean | any> {
        if (!this.connected) {
            throw new Error('Not connected to livesplit!');
        }

        const noNewlines = data.replace(/\n/g, '')
            .replace(/\r/g, '').trim();
        const command = `${noNewlines}\r\n`;

        if (expectResponse) {
            return new Promise<any>((resolve, reject) => {
                this.commands.push({
                    command,
                    resolve,
                });

                if (!this.processingCommands) {
                    this.sendNext();
                }
            });
        }

        if (this.processingCommands) {
            this.commandsWithoutResponse.push(command);
        } else {
            this.socket!.write(command);
        }

        return true;
    }

    async startOrSplit(): Promise<boolean> {
        return this.send('startorsplit');
    }

    async unsplit(): Promise<boolean> {
        return this.send('unsplit');
    }

    async reset(): Promise<boolean> {
        return this.send('reset');
    }
}

export const instance = new LiveSplit();