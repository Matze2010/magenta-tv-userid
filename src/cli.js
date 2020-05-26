import arg from 'arg';
import { prompt } from 'inquirer';
import MagentaBackend from './backend.js';


function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--username': String,
            '--password': String,
            '-u': '--username',
            '-p': '--password'
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        username: args['--username'] || false,
        password: args['--password'] || false
    };
}

async function promptForMissingOptions(options) {

    const questions = [];
    if (!options.username) {
        questions.push({
            type: 'input',
            name: 'username',
            message: 'Telekom EntertainTV / MagentaTV Username:',
            validate: function(input) {
                return (input != null && input != '')   
            }
        });
    }

    if (!options.password) {
        questions.push({
            type: 'password',
            name: 'password',
            message: 'Telekom EntertainTV / MagentaTV Password:',
            validate: function (input) {
                return (input != null && input != '')
            }
        });
    }

    const answers = await prompt(questions);
    return {
        ...options,
        username: options.username || answers.username,
        password: options.password || answers.password,
    };
}

async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);

    var magentaBackend = new MagentaBackend(options.username, options.password);

    try {
        console.log('-------------------------------------');
        console.log('Schritt 1 von 2: oAuth');
        await magentaBackend.oAuthPhase();
        console.log('Schritt 2 von 2: DTAuthentication');
        await magentaBackend.DTAuthenticatePhase();
        console.log('-------------------------------------');

    } catch (error) {
        console.log('-------------------------------------');
        console.error(error);
    }

    const userData = magentaBackend.userData();
    if (userData) {
        console.log(userData);
    }
    
    
}

export default cli
