pipeline {
    agent any

    environment {
        DEPLOY_USER = "ubuntu"                        // EC2 user
        DEPLOY_HOST = "13.205.115.213"               // EC2 IP
        DEPLOY_PATH = "/var/www/html/riu-cbackend"   // Deployment path
        SSH_KEY = "/var/lib/jenkins/.ssh/id_ed25519" // Path to Jenkins private key
        SUCCESS_MESSAGE = "✅ Deployment done"
    }

    triggers {
        // Poll GitHub every 2 minutes for commits on staging branch
        pollSCM('H/2 * * * *')
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Checking out staging branch from GitHub..."
                git branch: 'staging',
                    url: 'git@github.com:Mithu8521/riu-companyadmin-backend.git',
                    credentialsId: 'ubuntu-ssh'
            }
        }

        stage('Deploy Code') {
            steps {
                echo "Deploying code to EC2 server..."
                
                sh """
                ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                    echo "Starting deployment..."
                    
                    # Create deployment folder if not exists
                    mkdir -p ${DEPLOY_PATH}
                    
                    # Remove old code
                    rm -rf ${DEPLOY_PATH}/*
                '
                
                # Copy code from Jenkins workspace to EC2
                scp -i ${SSH_KEY} -r * ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/
                
                # Run build commands on EC2
                ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                    cd ${DEPLOY_PATH}
                    echo "Installing dependencies..."
                    npm i -f
                    echo "Running prebuild..."
                    npm run prebuild
                    echo "Running build:qa..."
                    npm run build:qa
                    echo "Restarting PM2 process..."
                    pm2 restart 0
                '
                """
            }
        }

        stage('Post Deployment') {
            steps {
                echo "${SUCCESS_MESSAGE}"
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful"
        }
        failure {
            echo "❌ Deployment Failed"
        }
    }
}
