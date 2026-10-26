import chalk from 'chalk';
import { format } from 'date-fns';

import { MessageType } from 'common/message.js';

const isDev = process.env.NODE_ENV === 'development';

function formatTime() {
    return chalk.grey(`[${format(Date.now(), 'HH:mm:ss')}]`);
}

/**
 * Log a Web Socket message being received or sent.
 */
export function logWS(send: boolean, id: string, type: MessageType) {
    const direction = send ? 'Sending to' : 'Receiving from';
    console.log(`${formatTime()} ${chalk.cyan(direction)} ${chalk.blueBright(id)} ${chalk.magenta(MessageType[type])}`);
}

export function logDebug(message: string, ...data: any[]) {
    if (isDev) {
        console.log(`${formatTime()} ${message}`, ...data);
    }
}

/**
 * Log a general message.
 */
export default function log(message: string, ...data: any[]) {
    console.log(`${formatTime()} ${message}`, ...data);
}
