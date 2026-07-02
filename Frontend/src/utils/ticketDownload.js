import QRCode from 'qrcode';

const fmtDate = (ds) => {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
};

const fmtPrice = (p) => (Number(p) === 0 ? 'FREE' : `KES ${Number(p).toLocaleString()}`);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ');
  let line = '';
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
  return cy;
}

export async function downloadTicketImage(order) {
  const ev = order.ticket?.event;
  const qrPayload = order.qrPayload;
  if (!qrPayload || !ev) throw new Error('Ticket not ready for download.');

  const W = 600;
  const H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FAF8F3';
  ctx.fillRect(0, 0, W, H);

  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, '#0B3D2E');
  headerGrad.addColorStop(1, '#0E5A43');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 96);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('HAFLA', W / 2, 40);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Event Ticket', W / 2, 64);

  const cardX = 28;
  const cardY = 112;
  const cardW = W - 56;
  const cardH = H - 148;
  ctx.fillStyle = '#fff';
  roundRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#E3DFD2';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.stroke();

  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const titleEndY = wrapText(ctx, ev.title, W / 2, cardY + 36, cardW - 48, 26);

  ctx.strokeStyle = '#E3DFD2';
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(cardX + 24, titleEndY + 18);
  ctx.lineTo(cardX + cardW - 24, titleEndY + 18);
  ctx.stroke();
  ctx.setLineDash([]);

  const info = [
    ['Date', fmtDate(ev.eventDate)],
    ['Time', ev.eventTime || '—'],
    ['Venue', ev.venue || '—'],
    ['Category', ev.category?.name || '—'],
    ['Ticket Type', order.ticket?.ticketType || 'REGULAR'],
    ['Quantity', `×${order.quantity}`],
    ['Amount Paid', fmtPrice(order.totalAmount)],
    ['Order ID', order.id?.slice(-10).toUpperCase() || '—'],
  ];

  let rowY = titleEndY + 44;
  const colL = cardX + 32;
  const colR = cardX + cardW / 2 + 8;
  ctx.textAlign = 'left';

  info.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? colL : colR;
    if (i % 2 === 0 && i > 0) rowY += 52;
    ctx.fillStyle = '#8A968D';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText(label.toUpperCase(), x, rowY);
    ctx.fillStyle = label === 'Amount Paid' ? '#B38A36' : '#0B3D2E';
    ctx.font = 'bold 13px system-ui, sans-serif';
    const val = String(value);
    if (ctx.measureText(val).width > cardW / 2 - 40) {
      wrapText(ctx, val, x, rowY + 16, cardW / 2 - 40, 16);
    } else {
      ctx.fillText(val, x, rowY + 16);
    }
  });

  const qrY = rowY + 72;
  const qrSize = 240;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: qrSize, margin: 1 });
  const qrImg = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  ctx.fillStyle = '#FAF8F3';
  roundRect(ctx, (W - qrSize - 24) / 2, qrY, qrSize + 24, qrSize + 24, 10);
  ctx.fill();
  ctx.strokeStyle = '#E3DFD2';
  ctx.lineWidth = 2;
  roundRect(ctx, (W - qrSize - 24) / 2, qrY, qrSize + 24, qrSize + 24, 10);
  ctx.stroke();
  ctx.drawImage(qrImg, (W - qrSize) / 2, qrY + 12, qrSize, qrSize);

  ctx.fillStyle = '#66766C';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Present this ticket at the event entrance.', W / 2, qrY + qrSize + 44);
  ctx.fillText('Valid for one-time scan only.', W / 2, qrY + qrSize + 62);

  const slug = (ev.title || 'ticket').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `hafla-ticket-${slug}.png`;
  link.click();
}
