function showSeatingOrder() {
  var seatAssignments = $('#seatingChart').sortable( "toArray", { attribute: 'id'} );
  alert(seatAssignments);
}
