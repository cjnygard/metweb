#!groovy
pipeline {

  agent {
    node {
      label 'master'
    }
  }

  tools {
    nodejs 'default'
  }

  stages {
    stage('Configure http proxy') {
      when { expression { env.HTTP_PROXY != '' } }
      steps {
         sh "npm config set proxy ${env.HTTP_PROXY}"
      }
    }

    stage('Configure https proxy') {
      when { expression { env.HTTPS_PROXY != '' } }
      steps {
         sh "npm config set https-proxy ${env.HTTPS_PROXY}"
      }
    }

    stage('Install') {
      steps {
        sh "env"
        sh "npm install"
      }
    }

    stage('For develop branch') {
      when { environment name: 'BRANCH_NAME', value: 'develop' }
      steps {
        echo "only executed in develop"
      }
    }

    stage('For master branch') {
      when { environment name: 'BRANCH_NAME', value: 'master' }
      steps {
        echo "only executed in master"
      }
    }

    stage('Build') {
      steps {
        sh "npm run build"
        sh "chmod --verbose --recursive u+r+w+X,g+r-w+X,o-r-w-x dist/"
        sh "ssh fmi@dev.elmo.fmi.fi \"mkdir -p /fmi/dev/www/test.fmi.fi/metweb/${env.BRANCH_NAME}\""
        sh "scp -rp dist/ fmi@dev.elmo.fmi.fi:/fmi/dev/www/test.fmi.fi/metweb/${env.BRANCH_NAME}/${env.BUILD_NUMBER}"
      }
    }
  }

  post {
    success {
      slackSend "Success ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
    unstable {
      slackSend "Unstable ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
    failure {
      slackSend "Failure ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
    changed {
      slackSend "Changed ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
    }
  }
}
