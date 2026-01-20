export function createNodesV2Context(options) {
    const { workspaceRoot = process.cwd(), nxJsonConfiguration = {} } = options ?? {};
    return {
        workspaceRoot,
        nxJsonConfiguration,
    };
}
//# sourceMappingURL=nx-plugin.js.map