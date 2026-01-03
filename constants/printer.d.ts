declare module 'react-native-bluetooth-escpos-printer' {
    export interface BluetoothManager {
        scanDevices(): Promise<string>;
        connect(address: string): Promise<void>;
        disableBluetooth(): Promise<void>;
        enableBluetooth(): Promise<void>;
        isBluetoothEnabled(): Promise<boolean>;
    }

    export interface BluetoothEscposPrinter {
        printerInit(): Promise<void>;
        printerLeftSpace(space: number): Promise<void>;
        printerLineSpace(space: number): Promise<void>;
        printerUnderLine(line: number): Promise<void>;
        printerAlign(align: number): Promise<void>;
        printText(text: string, options: object): Promise<void>;
        printColumn(columnWidths: number[], columnAligns: number[], columnTexts: string[], options: object): Promise<void>;
        setBlob(weight: number): Promise<void>;
        printPic(base64: string, options: object): Promise<void>;
        printQRCode(content: string, size: number, correctionLevel: number): Promise<void>;
        printBarCode(str: string, nType: number, nWidthX: number, nHeight: number, nHriFontType: number, nHriFontPosition: number): Promise<void>;
        cutPaper(): Promise<void>;
        
        ALIGN: {
            LEFT: number;
            CENTER: number;
            RIGHT: number;
        };
    }

    export const BluetoothManager: BluetoothManager;
    export const BluetoothEscposPrinter: BluetoothEscposPrinter;
}