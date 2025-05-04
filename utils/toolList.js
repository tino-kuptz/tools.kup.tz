const tools = [
    {
        name: "JSON Formatter",
        description: "Zeigt JSON-Objekte lesbar an.",
        link: "/formatting/json",
        category: "Formattierung",
        tags: ["JSON"],
        tokens: 0,
    },
    {
        name: "MX Resolver",
        description: "Löst die E-Mail Server von einer Domäne auf.",
        link: "/dns/mx",
        category: "DNS",
        tags: ["DNS"],
        tokens: 100,
    },
    {
        name: "NS Resolver",
        description: "Löst die Nameserver von einer Domäne auf.",
        link: "/dns/ns",
        category: "DNS",
        tags: ["DNS"],
        tokens: 100,
    },
];

export const get_tools_categories = () => {
    const categories = new Set();
    tools.forEach((tool) => {
        if (categories.has(tool.category)) return;
        categories.add(tool.category);
    });
    return Array.from(categories);
}

export const get_tools_by_category = (category) => {
    const toolsList = [];
    tools.forEach((tool) => {
        if (tool.category !== category) return;
        if (toolsList.find((t) => t.name === tool.name)) return;
        toolsList.push(tool);
    });
    return toolsList;
}

export const get_tools = () => {
    const toolsList = [];
    tools.forEach((tool) => {
        if (toolsList.find((t) => t.name === tool.name)) return;
        toolsList.push(tool);
    });
    return toolsList;
}

export const get_tool_by_url = (url) => {
    const tool = tools.find((tool) => tool.link === url);
    if (!tool) return null;
    return tool;
}
