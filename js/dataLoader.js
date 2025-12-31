export async function loadFrameworkData() {

    const dataPath = 'framework_data/'; 
    const manifestFile = 'manifest.json';

    try {
        const manifestResponse = await fetch(`${dataPath}${manifestFile}`);
        if (!manifestResponse.ok) {
            throw new Error(`HTTP error! Status: ${manifestResponse.status} for manifest file.`);
        }
        const manifest = await manifestResponse.json();
        const fileNames = manifest.files;

        const fetchPromises = fileNames.map(async (file) => {
            // Handle the special case for tool files and concepts_tool files being in a subdirectory
            const fullPath = (file.startsWith('tool_') || file.startsWith('concepts_tool_')) 
                ? `${dataPath}tools/${file}` 
                : `${dataPath}${file}`;
            
            let response;
            try {
                response = await fetch(fullPath);
            } catch (networkError) {
                throw new Error(`Network error while fetching '${fullPath}': ${networkError.message}`);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for file '${fullPath}'`);
            }

            const text = await response.text();
            try {
                // Attempt to parse the JSON content
                return JSON.parse(text);
            } catch (parseError) {
                // Provide a more detailed error message if parsing fails
                throw new Error(`JSON SyntaxError in file '${fullPath}': ${parseError.message}`);
            }
        });

        const allData = await Promise.all(fetchPromises);

        const dataMap = fileNames.reduce((acc, file, index) => {
            acc[file] = allData[index];
            return acc;
        }, {});

        // Compile the concepts_tool_N.json data into a single object indexed by toolId
        const toolConceptsMap = {}; 
        fileNames.forEach(file => {
            if (file.startsWith('concepts_tool_') && dataMap[file] && dataMap[file].toolId) {
                toolConceptsMap[dataMap[file].toolId] = dataMap[file].concepts; 
            }
        });

        // Get the comparative analysis data
        // Check if the file loaded correctly
        const comparativeData = dataMap['comparative_analysis.json'];
        if (!comparativeData) {
            console.warn("Warning: 'comparative_analysis.json' was not found in the loaded data map.");
        }

        // Assemble the tools array, merging in the new analysis
        const toolsArray = [
            dataMap['tool_1.json'], dataMap['tool_2.json'], dataMap['tool_3.json'],
            dataMap['tool_4.json'], dataMap['tool_5.json'], dataMap['tool_6.json'],
            dataMap['tool_7.json'], dataMap['tool_8.json'], dataMap['tool_9.json'],
            dataMap['tool_10.json']
        ].filter(Boolean).map(tool => { // Filter out any undefined tools if a file failed to load
            
            // If we have comparison data for this tool, inject it into 'perspectives'
            // We check both tool.id (e.g., "tool1") and tool.uid (e.g., "T1") just in case
            if (comparativeData) {
                const compData = comparativeData[tool.id] || comparativeData[tool.uid];
                
                if (compData && compData.comparativeAnalysis) {
                    // Ensure perspectives object exists
                    tool.perspectives = tool.perspectives || {};
                    
                    // Inject the data. We add a 'title' so the UI knows what to call the tab.
                    tool.perspectives.comparativeAnalysis = {
                        title: "Comparative Analysis",
                        simpleTitle: "Vs. Other Models",
                        ...compData.comparativeAnalysis
                    };
                }
            }
            return tool;
        }).sort((a, b) => {
            // Robust sorting that handles potential missing UIDs
            const uidA = a.uid ? parseInt(a.uid.slice(1)) : 0;
            const uidB = b.uid ? parseInt(b.uid.slice(1)) : 0;
            return uidA - uidB;
        });

        // Assemble the final, structured data object for the application
        const cognitiveToolkitData = {
            application_views: dataMap['views.json'],
            glossary_tool_data: dataMap['glossary_data.json'],
            playbooks_and_reports_data: dataMap['playbooks_and_reports.json'],
            methodologies_data: dataMap['methodologies.json'],
            planner_content: dataMap['planner_content.json'],
            project_genesis_data: dataMap['project_genesis_content.json'],
            systems_analysis_data: dataMap['systems_analysis_data.json'],
            onboarding_content: dataMap['onboarding_content.json'],
            scaffold_model_data: dataMap['scaffold-model.json'],
            framework_data: {
                ...dataMap['config.json'],
                dls_modalities_framework: dataMap['modalities.json'],
                frameworkNodes: dataMap['nodes.json'],
                ...dataMap['reference.json'],
                ...dataMap['system.json'],
                'matrix_clusters.json': dataMap['matrix_clusters.json'],
                tools: toolsArray, 
                toolConcepts: toolConceptsMap,
                process_models_data: dataMap['process_models.json'] 
            }
        };
        
        console.log("Inquiry & Creation data loaded and assembled successfully:", cognitiveToolkitData);
        return cognitiveToolkitData;

    } catch (error) {
        console.error("Failed to load or assemble framework data:", error);
        return null;
    }
}