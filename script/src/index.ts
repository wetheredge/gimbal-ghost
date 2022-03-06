import path from 'path';
import { StickManifestInfo } from './types';
import { readdir } from 'fs/promises';
import { BlackBoxLog } from './BlackBoxLog';
import { FrameResolver } from './FrameResolver';

// TODO: Implement error handling
// TODO: Implement args
(async () => {
    // Create a frame resolver with the stick manifest
    const stickManifestFilePath = path.resolve(__dirname, '../../sticks/manifest.json');
    const frameResolver = new FrameResolver({
        stickManifestPath: stickManifestFilePath,
        fps: 30,
    });

    // Create the .csv file of blackbox data
    const blackBoxFileDirectory = path.resolve(__dirname, '../../blackbox-logs');
    const blackBoxDirectoryFilenames = await readdir(blackBoxFileDirectory)
    const blackBoxFilenames = blackBoxDirectoryFilenames.filter(filename => filename.endsWith('.bbl'));
    const blackBoxFilePaths = blackBoxFilenames.map(filename => path.resolve(blackBoxFileDirectory, filename));
    const blackBoxLogs = blackBoxFilePaths.map(blackBoxFilePath => new BlackBoxLog({
        logPath: blackBoxFilePath,
        frameResolver: frameResolver,
        outputDirectoryPath: blackBoxFileDirectory,
    }));

    // Decode all of the blackbox logs
    const decodePromises = blackBoxLogs.map(blackBoxLog => blackBoxLog.decode());
    await Promise.all(decodePromises);

    // Parse all the blackbox logs into demux files for rendering
    const parsePromises = blackBoxLogs.map(blackBoxLog => blackBoxLog.parse());
    await Promise.all(parsePromises);

    // Render all the logs
    const renderPromises = blackBoxLogs.map(blackBoxLog => blackBoxLog.render());
    await Promise.all(renderPromises);

    // Dispose of all the temporary files
    const disposePromises = blackBoxLogs.map(blackBoxLog => blackBoxLog.dispose());
    await Promise.all(disposePromises);
    console.log('Complete!');
})();
