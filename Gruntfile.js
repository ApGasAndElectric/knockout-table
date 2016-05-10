/*global module:false*/
/*jshint node:true*/
module.exports = function (grunt) {

    grunt.registerMultiTask('crap', 'convert template html to js file with var called html', function(){
        this.files.forEach(function(file) {
        var contents = file.src.filter(function(filepath) {
            // Remove nonexistent files (it's up to you to filter or warn here).
            if (!grunt.file.exists(filepath)) {
                grunt.log.warn('Source file "' + filepath + '" not found.');
                return false;
            } else {
                return true;
            }
        }).map(function(filepath) {
            // Read and return the file's source.
            var lines = grunt.file.read(filepath).replace(new RegExp("'", 'g'), "\\'").match(/[^\r\n]+/g)
            var output = '';
            for(var i = 0; i < lines.length; i++){
                output += lines[i] + '\\\n'
            }
             
            return output;
        }).join('\\\n');
        // Write joined contents to destination filepath.
        grunt.file.write(file.dest, "var html = '" + contents + "';");
        // Print a success message.
        grunt.log.writeln('File "' + file.dest + '" created.');
        }); 
    });

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		meta: {
			banner: "/*=============================================================================\n" +
					"	Author:			Jonathan Arnold - @apge-jonathan								\n" +
					"	License:		MIT (http://opensource.org/licenses/mit-license.php)		\n" +
					"																				\n" +
					"	Description:	<%= pkg.description %>							\n" +
					"	Version:		<%= pkg.version %>											\n" +
					"===============================================================================\n*/\n"
		},
        copy: {
            main: {
                cwd:'src',
                expand: true,
                src: '**',
                dest: '.tmp/',
            }
        },
        crap: {
            main:{
                src:[
                    'src/KoTableTemplate.html'
                ],
                dest: '.tmp/KoTableTemplate.js'
            }
        },
		concat: {
			options: {
				separator: ";",
				banner: "<%= meta.banner %>",
				
			},
			dist: {
				src: [
					"<%= meta.banner %>",					
                    ".tmp/start.js",
                    ".tmp/KoTableTemplate.js",
					".tmp/KoTable.js",
					".tmp/KoTableRow.js",
					".tmp/KoTableColumn.js",
					".tmp/end.js"
				],
				dest: "dist/<%= pkg.name %>.js"
			}
		},
		
        

        
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");


	// Default task.
	grunt.registerTask("default", ["copy","crap","concat"]);

};