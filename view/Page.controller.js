jQuery.sap.require("sap.ui.core.util.Export");
jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");

sap.ui.controller("KLMCalculator.view.Page", {

	onInit: function() {
		// set model for tiles
		var sPath = jQuery.sap.getModulePath("KLMCalculator", "/data.json");
		var oModel = new sap.ui.model.json.JSONModel(sPath);
		this.getView().setModel(oModel);
		
		window.onkeypress = function(event) {
	        if (event.keyCode == '107') {
		        sap.ui.getCore().byId("idPage").getController().addTime(event);
	        }
        };
	},

	addTime: function(evt) {

		// Read the time for the tile
		var oModel = this.getView().getModel();
		
		if (evt.mParameters){
    		var tileIndex = parseInt(evt.mParameters.id.substr(evt.mParameters.id.length - 1), 10);
	    	var time = parseFloat(oModel.oData.TileCollection[tileIndex].number);
		}else{
            for (var tileIndex=0; tileIndex < oModel.oData.TileCollection.length; tileIndex++){
                if (oModel.oData.TileCollection[tileIndex].keyCode == evt.keyCode){
                    var time = parseFloat(oModel.oData.TileCollection[tileIndex].number);
                    break;
                }
            }
		}

		// Add the time to the total
		var totalValue = parseFloat(sap.ui.getCore().AppContext.totalValue) + parseFloat(time);
		sap.ui.getCore().AppContext.totalValue = totalValue.toFixed(2);

		// Get last line
		var lastLine = sap.ui.getCore().AppContext.Lines[sap.ui.getCore().AppContext.Lines.length - 1];
		if (lastLine && lastLine.title.indexOf(oModel.oData.TileCollection[tileIndex].title) > -1) {
			lastLine.times++;
			lastLine.total = parseFloat(lastLine.times * lastLine.number).toFixed(2);
			lastLine.title = oModel.oData.TileCollection[tileIndex].title +
				" (x" + lastLine.times + ")";
		} else {

			// Add a line to the overview
			var myLine = {};
			myLine.times = 1;
			myLine.code = oModel.oData.TileCollection[tileIndex].code;
			myLine.title = oModel.oData.TileCollection[tileIndex].title;
			myLine.number = oModel.oData.TileCollection[tileIndex].number;
			myLine.total = parseFloat(oModel.oData.TileCollection[tileIndex].number).toFixed(2);
			sap.ui.getCore().AppContext.Lines.push(myLine);
		}

		// Set the description on the button
		this.setTotal(sap.ui.getCore().AppContext.totalValue);

	},

	gotoOverview: function() {

		var oDialog1 = new sap.ui.commons.Dialog({
			width: "530px"
		});
		oDialog1.setTitle("Overview");

		//Create an instance of the table control
		var oTable = new sap.ui.table.Table({
			visibleRowCount: 10,
			firstVisibleRow: 10,
			selectionMode: sap.ui.table.SelectionMode.None,
			cellClick: function() {
				oDialog1.close();
			}
		});

		oTable.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({
				text: "Code"
			}),
			template: new sap.ui.commons.TextField().bindProperty("value", "code"),
			width: "60px"
		}));

		oTable.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({
				text: "Description"
			}),
			template: new sap.ui.commons.TextField().bindProperty("value", "title"),
			width: "280px"
		}));

		oTable.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({
				text: "Time"
			}),
			template: new sap.ui.commons.TextField().bindProperty("value", "number"),
			width: "60px"
		}));

		oTable.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({
				text: "Cumulated"
			}),
			template: new sap.ui.commons.TextField().bindProperty("value", "total"),
			width: "90px"
		}));

		// Add last line with the total time
		this.addTotal();

		//Create a JSON model from the Lines array
		var oModel = new sap.ui.model.json.JSONModel();
		var myLines = sap.ui.getCore().AppContext.Lines;

		oModel.setData({
			modelData: myLines
		});
		oTable.setModel(oModel);
		oTable.bindRows("/modelData");

		oDialog1.addContent(oTable);
		oDialog1.open();
	},

	resetCounter: function() {
		sap.ui.getCore().AppContext.totalValue = "0.00";
		this.setTotal(sap.ui.getCore().AppContext.totalValue);
		sap.ui.getCore().AppContext.Lines = [];
	},

	onDataExport: function() {

		//Create a JSON model from the Lines array
		var oModel = new sap.ui.model.json.JSONModel();
		var myLines = sap.ui.getCore().AppContext.Lines;

		// Add last line with the total time
		this.addTotal();

		oModel.setData({
			modelData: myLines
		});

		var oExport = new sap.ui.core.util.Export({

			// Type that will be used to generate the content. Own ExportType's can be created to support other formats
			exportType: new sap.ui.core.util.ExportTypeCSV({
				separatorChar: ";"
			}),

			// Pass in the model created above
			models: oModel,

			// binding information for the rows aggregation
			rows: {
				path: "/modelData"
			},

			// column definitions with column name and binding info for the content

			columns: [{
				name: "Code",
				template: {
					content: "{code}"
				}
      }, {
				name: "Description",
				template: {
					content: "{title}"
				}
      }, {
				name: "Time",
				template: {
					content: "{number}"
				}
      }, {
				name: "Total",
				template: {
					content: "{total}"
				}
      }]
		});

		// download exported file
		oExport.saveFile("KLMCalculator").always(function() {
			this.destroy();
		});
	},

	setTotal: function(value) {
		var oBtn = this.getView().byId("tb1");
		oBtn.setText("Total: " + value + " seconds");
	},

	addTotal: function() {

		// Remove Total from the list so that it can added to the end again
		for (var i = 0; i < sap.ui.getCore().AppContext.Lines.length; i++) {
			if (sap.ui.getCore().AppContext.Lines[i].title === "Total") {
				sap.ui.getCore().AppContext.Lines.splice(i, 1);
			}
		}

		var myLine = {};
		myLine.code = "";
		myLine.title = "Total";
		myLine.total = sap.ui.getCore().AppContext.totalValue;
		sap.ui.getCore().AppContext.Lines.push(myLine);

	}

});

