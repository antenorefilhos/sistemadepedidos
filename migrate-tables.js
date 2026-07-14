const fs = require('fs');
const filePath = 'src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
if (!content.includes('import CategoryModal')) {
    content = content.replace(
        'import SolidconIntegration from \'./components/SolidconIntegration\';',
        'import SolidconIntegration from \'./components/SolidconIntegration\';\nimport CategoryModal from \'./components/CategoryModal\';\nimport OrderDetailsModal from \'./components/OrderDetailsModal\';'
    );
}
if (!content.includes('import { Table')) {
    content = content.replace('import { useState, useEffect } from \'react\';', 'import { useState, useEffect } from \'react\';\nimport { Table, Button, Input, Select, SelectItem, Chip } from "@heroui/react";');
}

// 2. Extract Modals
content = content.replace(/\{\/\* Modal de Categoria \*\/\}[\s\S]*?(?=\{\/\* Modal de Detalhes do Pedido \*\/\}|\{\/\* Modal de Edição de Produto \*\/\}|<\/div>\n  \);\n\})/g, '');
content = content.replace(/\{\/\* Modal de Detalhes do Pedido \*\/\}[\s\S]*?(?={|\<\/div\>\n  \);\n\})/g, '');

const modalsStr = `
      {/* Modais */}
      {showCategoryModal && (
        <CategoryModal
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          handleSaveCategory={handleSaveCategory}
          setShowCategoryModal={setShowCategoryModal}
          handleCategoryNameChange={(name) => setCategoryForm({...categoryForm, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          products={products}
          setSelectedOrder={setSelectedOrder}
          handlePrintOrder={handlePrintOrder}
          formatDate={formatDate}
        />
      )}
`;
// Only add modals if they were removed
if (!content.includes('<CategoryModal')) {
    content = content.replace('</div>\n  );\n}', modalsStr + '\n    </div>\n  );\n}');
}

// 3. Refactor Sidebar buttons
content = content.replace(/<button\s+onClick=\{\(\) => setActiveTab\('([^']+)'\)\}\s+style=\{\{[\s\S]*?\}\}\s*>/g, 
  '<Button variant={activeTab === "$1" ? "flat" : "light"} color="primary" onPress={() => setActiveTab("$1")} className="w-full justify-start font-bold uppercase text-xs tracking-widest h-12">'
);
// Fix the closing tags only for the sidebar buttons
content = content.replace(/<\/button>\s*<\/li>/g, '</Button>\n          </li>');

// 4. Refactor Tables
// To avoid touching handlePrintOrder, we only replace tables with className="admin-table"
content = content.replace(/<table className="admin-table">/g, '<Table aria-label="Tabela">\n  <Table.ScrollContainer>\n    <Table.Content>');
// The closing </table> that corresponds to these are inside React blocks.
// Let's replace </table> that are immediately followed by </div>
content = content.replace(/<\/table>\s*<\/div>/g, '    </Table.Content>\n  </Table.ScrollContainer>\n</Table>\n                </div>');

// Replace standard HTML table parts but ONLY inside the <Table> blocks
// Since it's tricky with regex, we can do a function replacement
let newContent = '';
let inReactTable = false;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('<Table aria-label="Tabela">')) {
        inReactTable = true;
    }

    if (inReactTable) {
        // We are inside a HeroUI table block
        if (line.includes('<thead>')) line = line.replace('<thead>', '<Table.Header>');
        if (line.includes('</thead>')) line = line.replace('</thead>', '</Table.Header>');
        if (line.includes('<tbody>')) line = line.replace('<tbody>', '<Table.Body>');
        if (line.includes('</tbody>')) line = line.replace('</tbody>', '</Table.Body>');
        
        // Remove <tr> inside <Table.Header> (HeroUI v3 does not use Table.Row inside Header)
        if (line.includes('<tr>') && lines[i-1].includes('<Table.Header>')) {
            line = '';
        }
        if (line.includes('</tr>') && lines[i+1].includes('</Table.Header>')) {
            line = '';
        }

        // Convert data rows to Table.Row
        if (line.includes('<tr ')) line = line.replace(/<tr /g, '<Table.Row ').replace(/style=\{[^}]+\}/g, "style={{ borderBottom: '1px solid var(--border-color)' }}");
        if (line.includes('<tr>')) line = line.replace('<tr>', '<Table.Row>');
        if (line.includes('</tr>')) line = line.replace('</tr>', '</Table.Row>');

        // Convert th to Table.Column
        if (line.includes('<th')) line = line.replace(/<th[^>]*>/g, '<Table.Column>');
        if (line.includes('</th>')) line = line.replace(/<\/th>/g, '</Table.Column>');

        // Convert td to Table.Cell
        if (line.includes('<td')) line = line.replace(/<td[^>]*>/g, '<Table.Cell>');
        if (line.includes('</td>')) line = line.replace(/<\/td>/g, '</Table.Cell>');

        // Replace all leftover buttons with HeroUI Button inside the table
        if (line.includes('<button')) line = line.replace(/<button /g, '<Button ').replace(/<button>/g, '<Button>');
        if (line.includes('</button>')) line = line.replace(/<\/button>/g, '</Button>');
    }

    if (line.includes('</Table>')) {
        inReactTable = false;
    }

    if (line !== '') {
        newContent += line + '\n';
    } else if (lines[i] === '') {
        newContent += '\n'; // Preserve original empty lines
    }
}

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('Migration completed cleanly');
