$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip();
	
	// Append table with add row form on add new button click
    $(".add-new").click(function() {
		$(this).attr("disabled", "disabled");
		var index = $("table tbody tr:last-child").index();
        var row = '<tr>' +
            '<td class="one-handle"><input type="text" name="handles[]" class="form-control" id="handle"></td>' +
			'<td><a class="add" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a>'+
				 '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>'+
				 '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i>					  </a></td>' +
        '</tr>';
    	$("table").append(row);		
		$("table tbody tr").eq(index + 1).find(".add, .edit").toggle();
        $('[data-toggle="tooltip"]').tooltip();
    });
	
	// Add row on add button click
	$(document).on("click", ".add", function() {
		var empty = false;
		var input = $(this).parents("tr").find('input[type="text"]');
        input.each(function(){
			if(!$(this).val()) {
				$(this).addClass("error");
				empty = true;
			}
			else {
                $(this).removeClass("error");
            }
		});
		$(this).parents("tr").find(".error").first().focus();
		if(!empty) {
			input.each(function() {
				$(this).parent("td").html('<input id="handle" type="text" name="handles[]" class="form-control match" value="' + String(this.value) + '" readonly>');
			});			
			$(this).parents("tr").find(".add, .edit").toggle();
			$(".add-new").removeAttr("disabled");
		}		
    });
	
	// Edit row on edit button click
	$(document).on("click", ".edit", function() {		
        $(this).parents("tr").find("td:not(:last-child)").each(function() {
			$(this).html('<input id ="handle" type="text" name="handle[]s" class="form-control" value="">');
		});		
		$(this).parents("tr").find(".add, .edit").toggle();
		$(".add-new").attr("disabled", "disabled");
    });
	
	// Delete row on delete button click
	$(document).on("click", ".delete", function() {
        $(this).parents("tr").remove();
		$(".add-new").removeAttr("disabled");
    });
});
