const { execSync } = require('child_process');

// eslint-disable-next-line no-unused-vars
const execJsonObject = cmd => JSON.parse(execSync(cmd).toString());
const execJsonPerRow = cmd => {
    const rows = execSync(cmd).toString().match(/^(.+)$/gm);
    if (rows === null) return [];
    return rows.map(JSON.parse);
}
const validate = (name, regex) => {
    if (!regex.test(name)) {
        throw Error (`INVALID: ${regex}.test('${name}')`);
    } 
}

class DockerService {

    static getServices = () => {
        const cmd = `docker service ls --format '{{json .}}'`;
        return execJsonPerRow(cmd);
    }

    static inspectServices = (services) => {
        if (services.length === 0) return [];
        // eslint-disable-next-line no-useless-escape
        services.forEach(service => validate(service, /[\w\-]+/i));
        const format = `{
            "serviceName": {{json .Spec.Name}},
            "stackName": "{{index .Spec.Labels "com.docker.stack.namespace"}}",
            "imageFull": {{json .Spec.TaskTemplate.ContainerSpec.Image}}
        }`.replace(/\n/gi, ' ');
        const cmd = `docker service inspect ${services.join(' ')} --format '${format}'`;
        return execJsonPerRow(cmd);
    }

    static getSwarmImages = () => {
        const map = (serviceSpec) => {
            const { serviceName, stackName, imageFull } = serviceSpec;
            // eslint-disable-next-line no-useless-escape
            const imageRegex = /(?<image>[\w\/\.\-]+):(?<tag>[\w\-]+)(@(?<sha>sha256:[\w]+))?/i;
            const { image, tag, sha } = imageFull.match(imageRegex).groups;
            return {
                stackName,
                serviceName,
                imageFull,
                image,
                tag,
                sha
            };
        };

        const serviceNames = this.getServices().map(s => s.Name);
        if (serviceNames.length === 0) return [];
        const serviceSpecs = this.inspectServices(serviceNames);
        const images = serviceSpecs.map(map);
        return images;
    }
}

module.exports = DockerService;