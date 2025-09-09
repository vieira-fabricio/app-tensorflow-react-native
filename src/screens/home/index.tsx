import React, { useState } from 'react';
import { View, Image, ScrollView, Text, Alert } from 'react-native';

import { styles } from './styles'; 

import { Button } from '../../components/button';
import { Tip } from '../../components/tip';
import { Item, ItemProps } from '../../components/item';

import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { api } from '../../services/api';
import { Loading } from '../../components/loading';
import { foodContains } from '../../utils/foodContains';

const MODEL_ID = process.env.EXPO_PUBLIC_API_MODEL_ID;
const MODEL_VERSION_ID = process.env.EXPO_PUBLIC_API_MODEL_VERSION_ID;
const USER_ID = process.env.EXPO_PUBLIC_API_USER_ID;
const APP_ID = process.env.EXPO_PUBLIC_API_APP_ID;

//Home é um componente React Native que:
/*
 * 1.abre a galeria do dispositivo,
 * 2.deixa o usuário escolher/editar uma imagem,
 * 3.redimensiona e salva a imagem (gerando também base64),
 * 4.envia a imagem para uma API de classificação (Clarifai),
 * 5.mostra as classes detectadas com porcentagens,
 * 6.exibe uma dica caso não encontre “salad” (salada) no prato.
*/
export default function Home() {

//Estados (useState)  
/*
 * 1.selectedImageUri: URI local da imagem selecionada/salva (para exibir no <Image/>).
 * 2.isLoading: controla loading enquanto escolhe/processa a imagem e chama a API.
 * 3.items: lista de resultados da classificação (nome + porcentagem) para renderizar <Item/>.
 * 4.message: texto de dica (“Adicione vegetais…”), mostrado por <Tip/>.
*/
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ItemProps[]>([]);
  const [message, setMessage] = useState('');

//handleSelectImage
/*
 * 1.Permissão de galeria
 * 1.1.ImagePicker.requestMediaLibraryPermissionsAsync().
 * 1.2.Se não for concedida, mostra Alert e encerra a função.
 * 
 * 2.Liga o loading
 * 2.1.setIsLoading(true).
 *
 * 3.Abre a galeria
 * 3.1.ImagePicker.launchImageLibraryAsync({...}) com:
 * 3.2.mediaTypes: ['images'] (intenção: só imagens),
 * 3.3.allowsEditing: true (usuário pode cortar/ajustar),
 * 3.4.aspect: [4, 4] (corte em 1:1),
 * 3.5.quality: 1 (qualidade máxima).
 *Se o usuário cancelar: setIsLoading(false) e nada mais acontece.
 *Se não cancelar:
 *
 *4.Processa a imagem:
 *4.1.ImageManipulator.manipulate(result.assets[0].uri) → cria um “manipulador”.
 *4.2.manipulator.resize({ width: 900 }) → redimensiona para largura 900 px.
 *4.3.const processedImage = await manipulator.renderAsync() → renderiza a edição.
 *4.4.const savedImage = await processedImage.saveAsync({... base64: true }) → salva como JPEG, compressão 1, e gera base64.
 *
 *Atualiza a UI com a nova imagem: setSelectedImageUri(savedImage.uri).
 *Chama a classificação: foodDetected(savedImage.base64).
*/
  async function handleSelectImage() {

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(status !== 'granted'){
        Alert.alert('É necessario permitir o acesso a sua galeria!');
        return false;
      }

      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4,4],
        quality:1
      });

      if(result.canceled) {
        setIsLoading(false);
      }

      if(!result.canceled){
        //setSelectedImageUri(result.assets[0].uri);
        const manipulator = ImageManipulator.manipulate(result.assets[0].uri);
        manipulator.resize({ width: 900 });

        const processedImage = await manipulator.renderAsync();
        const savedImage = await processedImage.saveAsync({
          compress: 1,
          format: SaveFormat.JPEG,
          base64: true,
        });
        setSelectedImageUri(savedImage.uri);
        foodDetected(savedImage.base64);
      }
    } catch (error) {
      console.log(error);
    }
  }

//foodDetected(image64)
/*
   * 1.Guarda-chuva inicial
    * 1.1.Se image64 não existir, avisa no console, desliga o loading e retorna.
   * 2.Chamada à API de visão
    * 2.1.api.post('/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs', { ... })
    * 2.2.O corpo segue o padrão Clarifai: user_app_id, e inputs[0].data.image.base64.
   * 3.Processa resposta
    * 3.1.Pega outputs[0].data.concepts (labels com uma value entre 0 e 1).
    * 3.2.Mapeia para { name, percentage }, onde percentage = Math.round(value * 100) + '%'.
   * 4.Regra de dica (vegetais)
    * 4.1.const isVegetable = foodContains(foods, 'salad');
    * 4.2.Se não contiver “salad”, define message como “Adicione vegetais ao seu prato!”; caso tenha, limpa a mensagem.
   * 5.Atualiza lista e estado
    * 5.1.setItems(foods) para renderizar na tela.
    * 5.2.Desliga o loading em try/catch e também no finally.
   * Resultado: items passa a ter as classes/porcentagens e a UI re-renderiza.
  */
  async function foodDetected(image64: string | undefined) {
    if (!image64) {
      console.warn("Nenhuma imagem base64 fornecida");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post(
      `/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`, 
      {
        "user_app_id": {
          "user_id": USER_ID,
          "app_id": APP_ID
      },
      "inputs": [
        {
          "data": {
            "image": { "base64":image64 }
          }
        }
      ]
      });
      const foods = response.data.outputs[0].data.concepts.map((concept: any) => {
        return {
          name: concept.name,
          percentage: `${Math.round(concept.value * 100)}%`
        }
      });

      const isVegetable = foodContains(foods, 'salad');
      setMessage(isVegetable ? '' : 'Adicione vegetais ao seu prato!');

      setItems(foods);
      setIsLoading(false);
    } catch(error: any) {
      if (error.response) {
        console.error("Erro na API:", error.response.status, error.response.data);
      } else {
        console.error("Erro de rede:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

//Renderização (JSX)
/*
 * 1.Botão
  * 1.<Button onPress={handleSelectImage} disabled={isLoading}/>; desabilita quando carregando.
 * 2.Prévia / instrução
  * 2.1.Se selectedImageUri existir → <Image uri={...} />.
  * 2.2.Senão → <Text>Selecione a foto...</Text>.
 * 3.Área inferior (bottom)
  * 3.1.Se isLoading → <Loading/>.
 * 4.Senão:
  * 4.1.Se message existir → <Tip message={message}/> (a dica dos vegetais).
  * 4.2.<ScrollView> com <View style={styles.items}>
  * 4.3.Mapeia items em <Item key={item.name} data={item} />.
*/
  return (
    <View style={styles.container}>
        <Button onPress={handleSelectImage} disabled={isLoading}/>

        {
          selectedImageUri ?
            <Image
                source={{ uri: selectedImageUri }}
                style={styles.image}
                resizeMode="cover"
            />
            :
            <Text style={styles.description}>
                Selecione a foto do seu prato para analizar.
            </Text>
        }

        <View style={styles.bottom}>
          {
            isLoading ? <Loading /> :
            <>
              {message && <Tip message={message} />}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 24 }}>
                <View style={styles.items}>
                    {
                      items.map((item) => ( 
                        <Item key={item.name} data={item} />
                      ))
                    }
                </View>
              </ScrollView>
            </>
          }
        </View>
    </View>
  );
}