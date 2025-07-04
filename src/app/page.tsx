"use client"
import { Item } from "@/utils/types";
import  {useState, useEffect} from "react"

// Cognito のサインページの Amplify UI コンポーネント
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'
import { fetchAuthSession } from 'aws-amplify/auth';

// Congito サインインページ日本語化
import { I18n } from "aws-amplify/utils";
import { PT_BR } from "@/translations/pt-br/ja";
I18n.putVocabularies(PT_BR);
I18n.setLanguage('ja');

// Cognito のプール ID やクライアント ID を設定
import awsExports from '@/utils/aws-exports';
Amplify.configure(awsExports);

// Home ページ
const Home = () => {
    
    // State 
    const [itemName, setItemName] = useState("")
    const [category, setCategory] = useState("all")
    const [items, setItems] = useState([] as Item[])
    
    const [token, setToken] = useState("")


    // 商品の取得とステートへの設定
    useEffect(  () => {
        const getItems = async () => {
            // リクエストヘッダーの生成
            const requestHeaders: HeadersInit = new Headers();
            requestHeaders.set('Authorization', token);   
            // 商品取得 API 発行  
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/item/getall`, {method: "GET", headers: requestHeaders, cache: "no-store"})
            const jsonData = await response.json()
            const display_items = jsonData.allItems
            setItems(display_items)
        }
        if (token != "") {
           getItems()
        }
    },[token])


    // 価格をフォーマット
    const getFormattedPrice =  (price:number) => {
        return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY'
             }).format(price)
    }

    // 認証トークンの取得
    const getAuthToken =  () => {
        const fetchToken = async () => {
          const id_token: string = (await fetchAuthSession()).tokens?.idToken?.toString() || ""
          setToken(id_token)
        }
        fetchToken()
        return ""
    }

    // 検索ボタン選択時の処理
    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()    
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/item/search`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    itemName: itemName,
                    category: category
                })
            })
            const jsonData = await response.json()
            setItems(jsonData.Items)

            //
        }catch {
            alert("商品取得失敗")
        }
    }

    return (
        <Authenticator loginMechanisms={['email']}>
        {({ signOut, user }) => (
            <div className="container">
                <div>{getAuthToken()}</div>
                <h1>商品リスト</h1>
                <div style={{ textAlign: 'right' }}>
                    <p>ユーザー ID:{user?.signInDetails?.loginId}</p>
                    <button onClick={signOut}>サインアウト</button>
                </div>
                <div className="filter-container">
                    <form  onSubmit={handleSubmit}>
                        <input value={itemName} onChange={(e)=> setItemName(e.target.value)} type="text" id="search-input" placeholder="商品名で検索..."/>
                        <select id="category-filter"
                            value={category}
                            onChange={(e) => {
                            setCategory(e.target.value);
                            }}
                        >
                            <option value="all">すべてのカテゴリ</option>
                            <option value="electronics">電化製品</option>
                            <option value="clothing">衣類</option>
                            <option value="food">食品</option>
                            <option value="books">書籍</option>
                        </select>
                        <button id="search-btn">検索</button>
                    </form>
                </div>

                <div id="products-container" className="products-container">
                    {items.map( (item) => 
                    <div className="product-card" key={item.id}>
                        <img src={item.image}  alt="A" className="product-image" />
                        <div className="product-info">
                            <h3 className="product-name">{item.itemName}</h3>
                            <p className="product-category">{item.category}</p>
                            <p className="product-price">{getFormattedPrice(item.price)}</p>
                            <p className="product-description">{item.description}</p>
                        </div>
                    </div>

                    )}
                </div>
            </div>
            )}
        </Authenticator>
    );
}

export default Home