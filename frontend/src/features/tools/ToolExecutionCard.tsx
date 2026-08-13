import React from 'react';

interface ToolExecutionCardProps {
  execution: {
    tool_name: string;
    arguments: any;
    result: any;
  };
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ execution }) => {
  const { tool_name, result } = execution;

  if (!result || !result.success) return null;

  return (
    <div style={{
      backgroundColor: '#FFFDF9',
      border: '1px solid #F3EAD8',
      borderRadius: '0.625rem',
      padding: '0.75rem',
      marginTop: '0.5rem',
      fontSize: '0.85rem',
      color: '#292524',
      boxShadow: '0 2px 4px rgba(217, 119, 6, 0.05)'
    }}>
      {/* Menu Search Execution Card */}
      {tool_name === 'search_menu_items' && result.items && (
        <div>
          <div style={{ fontWeight: 700, color: '#D97706', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>📋</span> Found {result.items.length} Menu Item(s)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
            {result.items.map((item: any) => (
              <div key={item.id} style={{ backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #FDE68A' }}>
                <div style={{ fontWeight: 600, color: '#1C1917' }}>{item.name}</div>
                <div style={{ color: '#059669', fontWeight: 700 }}>${item.price.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: '#78350F', backgroundColor: '#FEF3C7', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', display: 'inline-block', marginTop: '0.25rem' }}>
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Add Execution Card */}
      {tool_name === 'add_to_cart' && result.items_added && (
        <div>
          <div style={{ fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
            🛒 Added to Order Cart (Est. Total: ${result.estimated_total})
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#44403C' }}>
            {result.items_added.map((item: any, idx: number) => (
              <li key={idx}>
                <strong>{item.quantity}x {item.item_name}</strong> — ${item.subtotal.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Branch List Card */}
      {tool_name === 'list_branches' && result.branches && (
        <div>
          <div style={{ fontWeight: 700, color: '#B45309', marginBottom: '0.5rem' }}>
            🏪 Available Branches
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {result.branches.map((b: any) => (
              <div key={b.id} style={{ backgroundColor: '#FFFFFF', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #FDE68A' }}>
                <span style={{ fontWeight: 700, color: '#1C1917' }}>{b.name}</span> — <span style={{ color: '#78350F' }}>{b.address}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Total Card */}
      {tool_name === 'calculate_order_total' && (
        <div>
          <div style={{ fontWeight: 700, color: '#E11D48', marginBottom: '0.25rem' }}>💳 Order Total Summary</div>
          <div>Subtotal: ${result.subtotal} | Tax: ${result.tax} | Total: <strong style={{ color: '#059669' }}>${result.total}</strong></div>
        </div>
      )}

      {/* Payment Initiate Card */}
      {tool_name === 'initiate_payment' && (
        <div>
          <div style={{ fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>✅ Payment Initiated</div>
          <div>Method: {result.payment_method} | Amount: <strong>${result.amount}</strong></div>
        </div>
      )}
    </div>
  );
};
