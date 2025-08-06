import { StatusBar } from 'expo-status-bar';
import { View, Image, ActivityIndicator } from 'react-native';
import { styles } from './styles'; 
import React, { useState } from 'react';
import { Button } from './components/button';
import * as ImagePicker from 'expo-image-picker';
import * as tensorflow from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as Filesystem from 'expo-file-system';
import { Classification, ClassificationProps } from './components/classification';

export default function App() {
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ClassificationProps[]>([])

  // função assíncrona, que permite usar await 
  // para esperar por operações assíncronas 
  // (como abrir a galeria ou classificar uma imagem).
  async function handleSelectImage() {
    //Ativa um "estado de carregamento" — 
    // geralmente usado para mostrar um indicador (ex: spinner) 
    // enquanto a imagem está sendo carregada ou processada.
    setIsLoading(true);

    try {
      //Abre a galeria do dispositivo usando ImagePicker.
      // O usuário pode escolher apenas imagens (mediaTypes: ['images']).
      // allowsEditing: true ,permite ao usuário cortar ou ajustar a imagem antes de selecionar.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true
      });
      //Verifica se o usuário não cancelou a seleção. 
      // Se ele cancelou, o processo termina aqui.
      if(!result.canceled){
        //Pega o URI (caminho local) da imagem selecionada.
        // Salva esse URI no estado setSelectedImageUri 
        // para exibir ou processar a imagem depois.
        const { uri } = result.assets[0];
        setSelectedImageUri(uri);
        //Chama uma função chamada imageClassification 
        // passando o URI da imagem
        //await indica que a execução vai esperar até 
        // essa classificação terminar antes de continuar.
        await imageClassification(uri);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function imageClassification(imageUri: string) {
    //Limpa resultados anteriores da classificação.
    setResults([]);

    //Garante que o TensorFlow.js esteja pronto antes de usar.
    await tensorflow.ready();
    //Carrega o modelo MobileNet, que é um modelo leve de deep 
    // learning para classificação de imagens.
    const model = await mobilenet.load();

    //Lê o conteúdo da imagem como uma string codificada em base64, usando Filesystem.
    // Isso é necessário porque o TensorFlow espera dados binários, não um simples URI.
    const imageBase64 = await Filesystem.readAsStringAsync(imageUri, {
      encoding: Filesystem.EncodingType.Base64
    });

    // Decodifica a string base64 em um ArrayBuffer usando utilitários do TensorFlow.
    // Isso transforma o texto base64 em bytes binários.
    const imgBuffer = tensorflow.util.encodeString(imageBase64, 'base64').buffer;
    // Converte o buffer em um Uint8Array, necessário para decodificar a imagem.
    const raw = new Uint8Array(imgBuffer);
    // Decodifica a imagem JPEG e a transforma em um tensor 3D. 
    const imageTensor = decodeJpeg(raw);

    // Classifica a imagem usando o modelo carregado (model).
    // Retorna um array de objetos com as classes previstas e suas probabilidade
    const classificationResult = await model.classify(imageTensor);
    // Atualiza o estado com os resultados da classificação
    setResults(classificationResult);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <Image 
       source={{ uri: selectedImageUri ? selectedImageUri : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFQLq_zxU1kYiJ1If0mU0oITrego5NQa07hw&s'}} 
       style={styles.image}
       />

       <View style={styles.results}>
          {
            results.map((result) => (
            <Classification key={result.className} data={result} />
            ))
          }
       </View>

      {
        isLoading
        ? <ActivityIndicator color="#5F1BBF"/>
        : <Button title='Selecionar Imagem' onPress={handleSelectImage}/>
      }

    </View>
  );
}
