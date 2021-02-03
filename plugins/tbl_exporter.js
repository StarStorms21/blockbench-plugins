(function() {
	var exportTblAction = new Action({
		id: 'export_tbl',
		name: 'Export Tabula (Tabula version 7.0.1 - 1.12.2)',
		icon: 'flip_to_back',
		description: 'Export Tabula (Tabula version 7.0.1 - 1.12.2), format type 4',
		category: 'file',
		version: '0.2.1',

		condition: () => Format.id === Formats.modded_entity.id || Format.id === "animated_entity_model",
		click: function (event) {
			cl("click!");

			save();
		}
	});


	Plugin.register('tbl_exporter', {
		title: 'Tabula Exporter',
		author: 'Starstorms21',
		description: 'Exports to a viable tabula format (Tabula Version 1.16.2+)',
		icon: 'fa-cubes',
		version: '0.0.5',
		variant: 'desktop',

		onload() {
			cl("Tabula Exporter Loaded!")
			MenuBar.addAction(exportTblAction, 'file.export');
		},
		onunload() {
			cl("Tabula Exporter Loaded!")
			MenuBar.removeAction('file.export.export_tbl');
		}
	});


	function cl(msg) {
		 console.log(msg);
	}

	function writeProjectInfo(){
		var tex = "{"



        tex += '"modelName" : "'+Project.name+'",';
        tex += '"authorName" : "'+Project.name+'_maker",';
        tex += '"projVersion" : 4,';
        tex += '"scale" : [1.0,1.0,1.0],';
        tex += '"textureWidth" : '+Project.texture_width+',';
		tex += '"textureHeight" : ' + Project.texture_height + ',';
		tex += '"metadata":[],'
		tex += '"cubeGroups":[],'
		tex += '"cubes":['

		tex += recurveWrite(Group.all[0], undefined);
	

		tex += '],'
			

		tex +='"anims": [],'
		tex +='"cubeCount": 10}'

  		return tex;
	}

	function writeCube(parentGroup, cube) {
		let parent_origin = cube.origin;

		if (parentGroup != undefined) {
			parent_origin = parentGroup.origin;
		}


		// parentGroup.origin[1] -  json.offset[1] - json.dimensions[1]
		let cubepos = [0,0,0];
		let pos = [0, 0, 0];
		let offset = [
			parent_origin[0] - cube.to[0],
			parent_origin[1] - cube.to[1],
		  -(parent_origin[2] - cube.from[2])
		];
		
		var ct = '{'

		//maybe check if the rotation is not 0 and add a group for cube rotations?

		ct += '"name": "' + cube.name + '",'
		ct += '"identifier":"' + bbuid(20) + '",'
		ct += '"dimensions":[' + cube.size(0, false) + ',' + cube.size(1, false) + ',' + cube.size(2, false) + '],'
		ct += '"position":[' + pos[0] + ',' + pos[1] + ',' + -pos[2] + '],'
		ct += '"offset":[' + offset[0] + ',' + offset[1] + ',' + offset[2] + '],'
		ct += '"rotation":[' + (-cube.rotation[0]) + ',' + cube.rotation[1] + ',' + cube.rotation[2] + '],'
		ct += '"scale":[1.0,1.0,1.0],'
		ct += '"txOffset":[' + cube.uv_offset[0] + ',' + cube.uv_offset[1] +'],'
		ct += '"txMirror":'+cube.mirror_uv+','
		ct += '"mcScale":0,'
		ct += '"opacity":100.0,'
		ct += '"hidden":' + !cube.visibility + ','
		ct += '"metadata":[],'
		ct += '"children":[]}'

		return ct;
	}

	function recurveWrite(group, prev) {
		var out = "";
		//for proper commas
		var groupCount = 0;
		var cubeCount = 0;


		//make a pseudogroup from a cube that has 0x0x0 size and the same position as the blockbench group privot
		out += writeGroupOpen(group,prev);

		group.children.forEach(element => {

			if (element instanceof Cube) {
				groupCount++;


				if (groupCount > 1 || cubeCount > 1) {
					out += ","
				}
				out += writeCube(group, element);

			}else if (element instanceof Group) {
				cubeCount++;
				if (groupCount > 1 || cubeCount > 1) {
					out += ","
				}
				out += recurveWrite(element,group);
				
			}
		});
		
		out += writeGroupClose(group);
		return out;
	}

	/**
	 * Writes the first half of the pseudo group. Left open right at the child section to allow for adding children.
	 * @param {Group} group The group to write down. 
	 * @param {Group} parent The parent group (May be left undefined).
	 */
	function writeGroupOpen(group, parent) {
		let pos;

		if (parent != undefined) {
			//since tabula works in local space with children as oposed to global, convert spaces here.
			pos = [(parent.origin[0] - group.origin[0]), (parent.origin[1] - group.origin[1]), (parent.origin[2] - group.origin[2])];

		} else {
			//for the root bone, its ok to leave it at y=0;
			pos = [group.origin[0], 0, group.origin[2]];
		}

		var ct = '{'
		id = bbuid(20);
		var b = 0; //debug visuals only, originaly 0
		ct += '"name": "_group_' + group.name + '",'
		ct += '"identifier":"' + id + '",'
		ct += '"dimensions":[' + b + ',' + b + ',' + b +'],'
		ct += '"position":[' + pos[0] + ',' + pos[1] + ',' + -pos[2] + '],'
		ct += '"offset":[' + -b/2 + ',' + -b/2 + ',' + -b/2 +'],'
		ct += '"rotation":[' + (-group.rotation[0]) + ',' + -group.rotation[1] + ',' + -group.rotation[2] + '],'
		ct += '"scale":[1.0,1.0,1.0],'
		ct += '"txOffset":[0,0],'
		ct += '"txMirror":false,'
		ct += '"mcScale":0,'
		ct += '"opacity":100.0,'
		ct += '"hidden":' + !group.visibility + ','
		ct += '"metadata":[],'
		ct += '"children":['

	
		return ct;
	}

	/**
	 * Writes the second half of the pseudo group, closing the group.
	 * @param {Group} group The group to write down (optional).
	 */
	function writeGroupClose(group) {
		return ']}';
	}

	

	function save() {
		var inf = writeProjectInfo(Outliner.root);
		var info = inf.replace(/}{/g, "},{"); //just in case 

		var path = Blockbench.export({
			extensions: ['tbl'],
			name: Project.name,
			content: "owo",
			custom_writer: function (content, path) {
				cl("saving:"+ path);
				saveAsTBL(path, info);
			}
		})

		//cl(info);

	}
	
	 
	function saveAsTBL(filename,filecontents) {
		var zip = new JSZip();
		zip.file("model.json", filecontents);

		zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
			.pipe(fs.createWriteStream(filename));

	}
	
})();