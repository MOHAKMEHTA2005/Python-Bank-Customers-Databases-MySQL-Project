import mysql.connector

accno=''
cname=''
addr=''
phone=''
pcard=''
acard=''
atype=''
Balance=''
def add():

 mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
 mycur=mydb.cursor()
 ch='y'
 while ch=='y' or ch=='Y':
    accno=input("\nAccount no:")
    cname=input("Customer name:")
    addr=input("Address:")
    phone=int(input("Phone no:"))
    pcard=input("Pan card no:")
    acard=input("Aadhar no:")
    atype=input("Account type\n\t1:Saving\n\t2:Current\n\t3:Regular\n\t4:Fixed Deposit\n\t5:Demat\n\t:")
    Balance=float(input("Account Balance:"))
    if atype==1:
        atype="Saving"
    elif atype==2:
        atype="Current"
    elif atype==3:
        atype="Regular"
    elif atype==4:
        atype="Fixed Deposit"
    elif atype==5:
        atype="Demat"
    str="INSERT INTO Customers VALUES('{}','{}','{}','{}','{}','{}','{}','{}')"
    query=(str.format(accno,cname,addr,phone,pcard,acard,atype,Balance))
    mycur.execute(query)
    mydb.commit()
    print("\nRecord inserted\n")
    ch=input("Want to Add more records(y/n)):")
def search():
    global cname, addr, phone, atype, pcard, Balance
    mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
    mycur=mydb.cursor()
    accno=input("Enter The Account no:")
    str="Select * from Customers where accno={}"
    query=str.format(accno)
    print('====================================================================')
    mycur.execute(query)
    myrec=mycur.fetchall()
    for x in myrec:
        accno=x[0]
        cname=x[1]
        addr=x[2]
        phone=x[3]
        pcard=x[4]
        acard=x[5]
        atype=x[6]
        Balance=x[7]
    print('====================================================================')
    print('                     State Bank Of India                        ')
    print('====================================================================')
    print('M-011 27479106                                 Branch-Model Town')
    print('====================================================================')
    print("Account Number:", accno)
    print("Customer Name:", cname)
    print('====================================================================')
    print("Address:", addr)
    print("Phone:", phone)
    print('====================================================================')
    print("Account Type:", atype)
    print("Pan Card:", pcard)
    print('====================================================================')
    print('====================================================================')
    print("Account Balance:", Balance)
    print('====================================================================')
def display():
    mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
    mycur=mydb.cursor()
    str="Select * from Customers"
    print('====================================================================')
    mycur.execute(str)
    myrec=mycur.fetchall()
    for x in myrec:
        accno=x[0]
        cname=x[1]
        addr=x[2]
        phone=x[3]
        pcard=x[4]
        acard=x[5]
        atype=x[6]
        Balance=x[7]
        print(accno,cname,addr,phone,pcard,acard,atype,Balance)
def edit():
    mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
    mycur=mydb.cursor()
    str="Select * from Customers"
    print('====================================================================')
    print("Before Updation")
    mycur.execute(str)
    myrec=mycur.fetchall()
    for x in myrec:
        accno=x[0]
        cname=x[1]
        addr=x[2]
        phone=x[3]
        pcard=x[4]
        acard=x[5]
        atype=x[6]
        Balance=x[7]
        print(accno,cname,addr,phone,pcard,acard,atype,Balance)
        accno=int(input("Enter The Customer you want to Update:"))
        print("Enter the changes you want\n")
        cname=input("Customer name: ")
        addr=input("Address:")
        phone=("Phone no: ")
        pcard=input("Pan card no: ")
        acard=input("Aadhar no: ")
        atype=input("Account type\n\t1:Saving\n\t2:Current\n\t3:Regular\n\t4:Fixed Deposit\n\t5:Demat\n\t:")
        Balance=float(input("Account Balance: "))
        str="""Update Customers set
        cname=(),addr=(),phone=(),pcard=(),acard=(),atype=(),Balance=(),whereaccno=()"""
        query=str.format(cname,addr,phone,pcard,acard,atype,Balance,accno)
        mycur.execute(query)
        mydb.commit()
        str="Select * from Customers"
        print('====================================================================')
        print("After Updation")
        mycur.execute(str)
        myrec=mycur.fetchall()
        for x in myrec:
            accno=x[0]
            cname=x[1]
            addr=x[2]
            phone=x[3]
            pcard=x[4]
            acard=x[5]
            atype=x[6]
            Balance=x[7]
            print("accno","cname","addr","phone","pcard","acard","atype","Balance")
def delete():
    mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
    mycur=mydb.cursor()
    str="Select * from Customers"
    print('====================================================================')
    print("before Deletion")
    mycur.execute(str)
    myrec=mycur.fetchall()
    for x in myrec:
        accno=x[0]
        cname=x[1]
        addr=x[2]
        phone=x[3]
        pcard=x[4]
        acard=x[5]
        atype=x[6]
        Balance=x[7]
        print("accno","cname","addr","phone","pcard","acard","atype","Balance")
        accno=input("\nEnter The Account no: ")
        str="Delete from Customers where accno={}"
        query=str.format(accno)
        mycur.execute(query)
        mydb.commit()
        mycur.execute(query)
        mydb.commit()
        print("record deleted")
        str="Select * from Customers"
        print('====================================================================')
        print("After Deletion")
        mycur.execute(str)
        myrec=mycur.fetchall()
        for x in myrec:
            accno=x[0]
            cname=x[1]
            addr=x[2]
            phone=x[3]
            pcard=x[4]
            acard=x[5]
            atype=x[6]
            Balance=x[7]
            print("accno","cname","addr","phone","pcard","acard","atype","Balance")
def generate():
    mydb=mysql.connector.connect(host="localhost",user="root",passwd="passwd",database="Bank_Customers_Database")
    mycur=mydb.cursor()
    accno=int(input("Customer no: "))
    mycur.execute(f"Select * from Customers where accno ='{accno}'")
    print('====================================================================')
    mycur.execute(str)
    myrec=mycur.fetchall()
    for x in myrec:
        accno=x[0]
        cname=x[1]
        addr=x[2]
        phone=x[3]
        pcard=x[4]
        acard=x[5]
        atype=x[6]
        Balance=x[7]
print('====================================================================')
print('                     State Bank Of India                        ')
print('====================================================================')
print('M-011 27479106                                 Branch-Model Town')
print('====================================================================')
print("Account Number:",accno)
print("Customer Name:",cname)
print('====================================================================')
print("Address:",addr)
print("Phone:",phone)
print('====================================================================')
print("Account Type:",atype)
print("Pan Card:",pcard)
print('====================================================================')
print('====================================================================')
print("Account Balance:",Balance)
print('====================================================================')
ch='y'
while ch=='y' or ch=='Y':
        print('====================================================================')
        print("1. To Add new record")
        print("2. To Search a record")
        print("3. To Update the Record")
        print("4. To Delete the record")
        print("5. To View all the Records")
        print("6. To Generate the Report\n")
        print('====================================================================')
        ch=int(input("Enter the choice: "))
        if ch==1:
            add()
        elif ch==2:
            search()
        elif ch==3:
            edit()
        elif ch==4:
            delete()
        elif ch==5:
            display()
        elif ch==6:
            generate()
        print('====================================================================')
        ch=input("Want to See Main Menu(y/n):")