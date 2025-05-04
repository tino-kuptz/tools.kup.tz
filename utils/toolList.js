const tools = [
    {
        name: "JSON Formatter",
        description: "Zeigt JSON-Objekte lesbar an.",
        link: "/formatting/json",
        category: "Formattierung",
        tags: ["JSON"],
    }
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
