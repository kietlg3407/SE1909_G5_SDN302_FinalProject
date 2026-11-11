const fs = require('fs');
const filePath = 'shop-project/frontend/src/pages/CheckoutPage.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fetch coupons without status=active so we get all and display their actual statuses (active, expired, limit_reached)
code = code.replace(
  "const res = await api.get('/api/coupons?status=active&limit=50');",
  "const res = await api.get('/api/coupons?limit=50');"
);

// 2. In coupon card rendering:
const oldCardMap = `                  {availableCoupons.map((c) => {
                    const isApplied = appliedCoupon?.code === c.code;
                    const isEligible = !c.minOrderValue || cartTotal >= c.minOrderValue;
                    const discountText =
                      c.discountType === 'percentage'
                        ? \`Giảm \${c.discountValue}%\`
                        : \`Giảm \${formatCurrency(c.discountValue)}\`;
                    const minOrderText =
                      c.minOrderValue > 0
                        ? \`Đơn từ \${formatCurrency(c.minOrderValue)}\`
                        : 'Không giới hạn đơn tối thiểu';

                    return (
                      <div
                        key={c._id || c.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isApplied
                            ? '1.5px solid #10b981'
                            : isEligible
                            ? '1px dashed #7c3aed'
                            : '1px solid #e2e8f0',
                          background: isApplied ? '#f0fdf4' : isEligible ? '#faf5ff' : '#f8fafc',
                          opacity: isEligible ? 1 : 0.75,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '13px',
                                color: isApplied ? '#059669' : '#6d28d9',
                                background: isApplied ? '#dcfce7' : '#ede9fe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {c.code}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                              {discountText}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {minOrderText}
                            {c.expiryDate && (
                              <span> • HSD: {new Date(c.expiryDate).toLocaleDateString('vi-VN')}</span>
                            )}
                          </div>
                          {!isEligible && (
                            <div style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px' }}>
                              Cần mua thêm {formatCurrency(c.minOrderValue - cartTotal)} để áp dụng
                            </div>
                          )}
                        </div>

                        <div>
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#ef4444',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Đang dùng
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!isEligible || applyingCoupon}
                              onClick={() => handleApplyCoupon(c.code)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: isEligible ? '#fff' : '#94a3b8',
                                background: isEligible ? '#7c3aed' : '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                              }}
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}`;

const newCardMap = `                  {availableCoupons.map((c) => {
                    const isApplied = appliedCoupon?.code === c.code;
                    const isExpired = c.isExpired ?? (c.expiryDate && new Date(c.expiryDate).getTime() < Date.now());
                    const isLimitReached = c.isLimitReached ?? (c.usageLimit !== null && c.usageLimit !== undefined && c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit);
                    const isUsable = !isExpired && !isLimitReached;
                    const isEligible = isUsable && (!c.minOrderValue || cartTotal >= c.minOrderValue);

                    const discountText =
                      c.discountType === 'percentage'
                        ? \`Giảm \${c.discountValue}%\`
                        : \`Giảm \${formatCurrency(c.discountValue)}\`;
                    const minOrderText =
                      c.minOrderValue > 0
                        ? \`Đơn từ \${formatCurrency(c.minOrderValue)}\`
                        : 'Không giới hạn đơn tối thiểu';

                    const borderStyle = isApplied
                      ? '1.5px solid #10b981'
                      : isExpired
                      ? '1px solid #fecaca'
                      : isLimitReached
                      ? '1px solid #fde68a'
                      : isEligible
                      ? '1px dashed #7c3aed'
                      : '1px solid #e2e8f0';

                    const bgStyle = isApplied
                      ? '#f0fdf4'
                      : isExpired
                      ? '#fef2f2'
                      : isLimitReached
                      ? '#fffbeb'
                      : isEligible
                      ? '#faf5ff'
                      : '#f8fafc';

                    return (
                      <div
                        key={c._id || c.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: borderStyle,
                          background: bgStyle,
                          opacity: isUsable ? (isEligible ? 1 : 0.8) : 0.65,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '13px',
                                color: isApplied ? '#059669' : isExpired ? '#b91c1c' : isLimitReached ? '#b45309' : '#6d28d9',
                                background: isApplied ? '#dcfce7' : isExpired ? '#fee2e2' : isLimitReached ? '#fef3c7' : '#ede9fe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {c.code}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                              {discountText}
                            </span>

                            {/* Status badges */}
                            {isExpired && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                Đã hết hạn
                              </span>
                            )}
                            {isLimitReached && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                Hết lượt dùng
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {minOrderText}
                            {c.expiryDate && (
                              <span> • HSD: {new Date(c.expiryDate).toLocaleDateString('vi-VN')}</span>
                            )}
                            {c.usageLimit && (
                              <span> • Đã dùng: {c.usedCount || 0}/{c.usageLimit}</span>
                            )}
                          </div>

                          {/* Explanatory notes */}
                          {isExpired ? (
                            <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', fontWeight: 600 }}>
                              • Mã giảm giá đã hết hạn sử dụng
                            </div>
                          ) : isLimitReached ? (
                            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
                              • Mã giảm giá đã hết lượt sử dụng ({c.usedCount || 0}/{c.usageLimit} lượt)
                            </div>
                          ) : !isEligible ? (
                            <div style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px' }}>
                              Cần mua thêm {formatCurrency(c.minOrderValue - cartTotal)} để áp dụng
                            </div>
                          ) : null}
                        </div>

                        <div>
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#ef4444',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Đang dùng
                            </button>
                          ) : isExpired ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#94a3b8',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'not-allowed',
                              }}
                            >
                              Đã hết hạn
                            </button>
                          ) : isLimitReached ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#94a3b8',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'not-allowed',
                              }}
                            >
                              Hết lượt
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!isEligible || applyingCoupon}
                              onClick={() => handleApplyCoupon(c.code)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: isEligible ? '#fff' : '#94a3b8',
                                background: isEligible ? '#7c3aed' : '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                              }}
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}`;

const isCRLF = code.includes('\r\n');
const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldCardMap.replace(/\r\n/g, '\n');
const normNew = newCardMap.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
  const result = normCode.replace(normOld, normNew);
  fs.writeFileSync(filePath, isCRLF ? result.replace(/\n/g, '\r\n') : result, 'utf8');
  console.log('Successfully updated CheckoutPage.jsx');
} else {
  console.error('Target not found in CheckoutPage.jsx');
  process.exit(1);
}

