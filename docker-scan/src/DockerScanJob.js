const DockerScanService = require("./DockerScanService");
const DockerService = require("./DockerService");

const DOCKER_SCAN_JOB_SCAN_INTERVAL_SECONDS = process.env.DOCKER_SCAN_JOB_SCAN_INTERVAL_SECONDS || 60;
const DOCKER_SCAN_JOB_INTERVAL_SECONDS = process.env.DOCKER_SCAN_JOB_INTERVAL_SECONDS || 10;
const DOCKER_SCAN_JOB_MAX_CONCURRENCY = process.env.DOCKER_SCAN_JOB_MAX_CONCURRENCY || 1;

class DockerScanJob {
    static init = () => {
        DockerScanJob.queue = [];
        DockerScanJob.inProgress = [];
        setInterval(() => {
                DockerScanJob.checkQueue();
        }, DOCKER_SCAN_JOB_INTERVAL_SECONDS * 1000);
        setInterval(() => {
            DockerScanJob.pushQueue(DockerService.getSwarmImages().map(i => i.imageFull));
        }, DOCKER_SCAN_JOB_SCAN_INTERVAL_SECONDS * 1000);
    }

    static getQueue = () => {
        const { inProgress, queue } = DockerScanJob;
        inProgress.forEach(item => item.seconds_elapsed = (new Date()-item.start)/1000);
        return { inProgress, queue };
    }

    static checkQueue = () => {
        // check in-progress for completed jobs...
        if (DockerScanJob.inProgress.length >= DOCKER_SCAN_JOB_MAX_CONCURRENCY) {
            const done = DockerScanJob.inProgress.filter(({image}) => DockerScanService.scanExists(image));
            done.forEach(item => console.log(`SCAN COMPLETE: ${item.image} (${(new Date()-item.start)/1000}s)`));
            DockerScanJob.inProgress = DockerScanJob.inProgress.filter(image => !done.includes(image));
            if (DockerScanJob.inProgress.length >= DOCKER_SCAN_JOB_MAX_CONCURRENCY) {
                return;
            }
        }
        // push jobs to in-progress...
        while (DockerScanJob.queue.length > 0 && DockerScanJob.inProgress.length < DOCKER_SCAN_JOB_MAX_CONCURRENCY) {
            const image = DockerScanJob.queue.shift();
            console.log(`IN-PROGRESS: ${image}`);
            DockerScanJob.inProgress.push({image, start: new Date()});
            DockerScanService.scan(image);
        }
    }

    static pushQueue = (images) => {
        images = Array.isArray(images) ? [...new Set(images)] : [images];
        const newImages = images.filter(image => {
            return DockerScanService.validateImage(image) &&
                !DockerScanJob.queue.includes(image) && 
                !DockerScanJob.inProgress.includes(image) &&
                !DockerScanService.scanExists(image);
        });
        newImages.forEach(image => console.log(`PUSH TO QUEUE: ${image}`));
        DockerScanJob.queue.push(...newImages);
        return newImages;
    }
}

module.exports = DockerScanJob;
