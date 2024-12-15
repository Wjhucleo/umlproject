import React, { useEffect, useState } from 'react';
import { dia, shapes } from 'jointjs';
import 'jointjs/dist/joint.css';

const App = () => {
    const [javaCode, setJavaCode] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [className, setClassName] = useState('');
    const [attributes, setAttributes] = useState('');
    const [methods, setMethods] = useState('');
    const [graph, setGraph] = useState(null);

    useEffect(() => {
        const graphInstance = new dia.Graph();
        setGraph(graphInstance);

        const paper = new dia.Paper({
            el: document.getElementById('canvas'),
            model: graphInstance,
            width: 800,
            height: 600,
            gridSize: 10,
            drawGrid: {
                name: 'dot',
                args: { color: '#e0e0e0', thickness: 1 },
            },
        });

        let selectedElement = null;

        paper.on('element:pointerdown link:pointerdown', (cellView) => {
            selectedElement = cellView.model;
            cellView.highlight();
            setTimeout(() => cellView.unhighlight(), 1000);
        });

        const deleteSelectedElement = () => {
            if (selectedElement && graphInstance.getCell(selectedElement.id)) {
                selectedElement.remove();
                selectedElement = null;
            }
        };

        const addRelation = (relationType) => {
            const elements = graphInstance.getElements();
            if (elements.length < 2) {
                alert('Ajoutez au moins deux classes avant de créer une relation.');
                return;
            }

            const link = new dia.Link({
                source: { id: elements[0].id },
                target: { id: elements[1].id },
                attrs: {
                    '.connection': { stroke: '#4263eb', 'stroke-width': 2 },
                    '.marker-target': {
                        fill: '#4263eb',
                        d: getMarker(relationType),
                    },
                },
            });

            graphInstance.addCell(link);
        };

        const getMarker = (relationType) => {
            switch (relationType) {
                case 'aggregation':
                    return 'M 10 -5 L 0 0 L 10 5 z';
                case 'composition':
                    return 'M 10 -5 L 0 0 L 10 5 L 20 0 z';
                case 'generalization':
                    return 'M 10 -5 L 0 0 L 10 5 z';
                case 'realization':
                case 'dependency':
                    return 'M 10 -5 L 0 0 L 10 5 z';
                case 'association':
                default:
                    return null;
            }
        };

        document.querySelectorAll('.palette-item').forEach((item) => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                if (type === 'delete') {
                    deleteSelectedElement();
                } else if (type === 'class') {
                    setIsModalOpen(true);
                } else {
                    addRelation(type);
                }
            });
        });

        const generateJavaCode = () => {
            const elements = graphInstance.getElements();
            let code = '';

            elements.forEach((element) => {
                if (element.isElement()) {
                    const text = element.attr('text/text');
                    const [name, attributes, methods] = text.split('\n---\n');
                    code += `public class ${name} {
`;

                    if (attributes) {
                        const attrList = attributes.split('\n');
                        attrList.forEach((attr) => {
                            code += `    private String ${attr};
`;
                        });
                    }

                    if (methods) {
                        const methodList = methods.split('\n');
                        methodList.forEach((method) => {
                            code += `    public void ${method}() {}
`;
                        });
                    }

                    code += `}

`;
                }
            });

            setJavaCode(code);
        };

        document.getElementById('generate-code').addEventListener('click', generateJavaCode);
    }, []);

    const handleModalSubmit = () => {
        if (!graph) return;

        const element = new shapes.basic.Rect({
            position: { x: 100, y: 100 },
            size: { width: 150, height: 100 },
            attrs: {
                rect: { fill: '#74c0fc', stroke: '#4263eb', 'stroke-width': 2 },
                text: {
                    text: `${className}\n---\n${attributes}\n---\n${methods}`,
                    fill: '#1c1c1e',
                    'font-size': 12,
                },
            },
        });

        graph.addCell(element);
        setIsModalOpen(false);
        setClassName('');
        setAttributes('');
        setMethods('');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa' }}>
            <div
                style={{
                    width: '250px',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    borderRight: '2px solid #ced4da',
                }}
            >
                <h3 style={{ color: '#495057' }}>Code en Java</h3>
                <textarea
                    id="java-code"
                    value={javaCode}
                    readOnly
                    style={{
                        width: '100%',
                        height: '400px',
                        marginBottom: '10px',
                        padding: '5px',
                        border: '1px solid #adb5bd',
                        borderRadius: '5px',
                        resize: 'none',
                    }}
                ></textarea>
                <button
                    id="generate-code"
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#4263eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Générer
                </button>
            </div>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <h1 style={{ color: '#4263eb' }}>Merise 2 Diagramme UML</h1>
                <h2 style={{ color: '#495057', marginBottom: '20px' }}>Diagramme de Classe</h2>
                <div
                    id="canvas"
                    style={{
                        border: '2px solid #4263eb',
                        borderRadius: '10px',
                        width: '800px',
                        height: '600px',
                    }}
                ></div>
            </div>
            <div
                style={{
                    width: '150px',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px',
                    borderLeft: '2px solid #ced4da',
                }}
            >
                <h3 style={{ color: '#495057', fontSize: '1rem', marginBottom: '10px' }}>Palette</h3>
                <button className="palette-item" data-type="class">Ajouter une Classe</button>
                <button className="palette-item" data-type="association">Association</button>
                <button className="palette-item" data-type="aggregation">Agrégation</button>
                <button className="palette-item" data-type="composition">Composition</button>
                <button className="palette-item" data-type="generalization">G                énéralisation</button>
                <button className="palette-item" data-type="dependency">Dépendance</button>
                <button className="palette-item" data-type="realization">Réalisation</button>
                <button className="palette-item" data-type="delete" style={{ color: 'red' }}>
                    Supprimer
                </button>
            </div>

            {isModalOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            width: '400px',
                        }}
                    >
                        <h3 style={{ marginBottom: '15px', color: '#495057' }}> Classe</h3>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ marginRight: '10px' }}>Nom</h4>
                            <input
                                type="text"
                                placeholder="Nom de la classe"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #adb5bd',
                                    borderRadius: '5px',
                                }}
                            />
                        </div>
                                
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ marginRight: '10px' }}>Attribut</h4>
                          <textarea
                              placeholder="Attributs (séparés par des retours à la ligne)"
                              value={attributes}
                              onChange={(e) => setAttributes(e.target.value)}
                              style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #adb5bd',
                                  borderRadius: '5px',
                                  resize: 'none', // Empêche le redimensionnement
                              }}
                          />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ marginRight: '10px' }}>Méthodes</h4>
                          <textarea
                              placeholder="Méthodes (séparées par des retours à la ligne)"
                              value={methods}
                              onChange={(e) => setMethods(e.target.value)}
                              style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #adb5bd',
                                  borderRadius: '5px',
                                  resize: 'none', // Empêche le redimensionnement
                              }}
                          />
                      </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handleModalSubmit}
                                style={{
                                    padding: '10px',
                                    backgroundColor: '#4263eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    width: '45%',
                                }}
                            >
                                Ajouter
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    padding: '10px',
                                    backgroundColor: '#adb5bd',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    width: '45%',
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

