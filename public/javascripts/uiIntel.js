function showSeatingOrder() {
  var seatAssignments = $('#seatingChart').sortable( "toArray", { attribute: 'id'} );
  $('#data').attr('value',seatAssignments.join(','));
  $('#seatForm').attr('action','/seats');
  $('#seatForm').submit();
}
