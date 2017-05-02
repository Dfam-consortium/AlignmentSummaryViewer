module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: ['src/AlignmentSummaryViewer.js'],
      options: {
         configFile: 'conf/eslint.json',
         fix: true
      }
    },
    jshint: {
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {  
        reporterOutput: "" // Otherwise grunt complains about null path
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        compress: {
          drop_console: true  // Remove console.log statements
        }
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    dist: {
      files: {
        'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-eslint');

  //grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('default', ['eslint', 'concat', 'uglify']);

};
