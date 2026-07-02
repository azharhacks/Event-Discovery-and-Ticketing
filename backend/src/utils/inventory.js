const restoreTicketStock = async (tx, ticketId, quantity) => {
  await tx.ticket.update({
    where: { id: ticketId },
    data: { quantityAvailable: { increment: quantity } },
  });
};

module.exports = { restoreTicketStock };
